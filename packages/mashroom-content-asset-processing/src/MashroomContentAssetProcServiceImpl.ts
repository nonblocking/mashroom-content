
import {isAbsolute, resolve, basename} from 'path';
import {URL} from 'url';
import {statSync, createReadStream, createWriteStream} from 'fs';
import {Readable} from 'stream';
import {createHash} from 'crypto';
import {ensureDirSync, readJSONSync, writeJSONSync} from 'fs-extra';
import fetch from 'node-fetch';
import sharp from 'sharp';
import {lookup as lookupMimeType} from 'mime-types';

import type {Duplex} from 'stream';
import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomContentAssetProc,
    MashroomContentAssetProcService,
    MashroomContentAssetProcImageConvert,
    MashroomContentAssetProcImageResize,
    MashroomContentAssetProcMeta,
} from '../type-definitions';

export default class MashroomContentAssetProcServiceImpl implements MashroomContentAssetProcService {

    private _cacheFolder = '';
    private _logger: MashroomLogger;

    constructor(private scaleUp: boolean, private defaultQuality: number, private cacheEnable: boolean, private cacheDefaultTTLSec: number, cacheFolder: string, pluginContextHolder: MashroomPluginContextHolder) {
        const {loggerFactory, serverConfig} = pluginContextHolder.getPluginContext();
        this._logger = loggerFactory('mashroom.content.assets');
        if (this.cacheEnable) {
            if (isAbsolute(cacheFolder)) {
                this._cacheFolder = cacheFolder;
            } else {
                this._cacheFolder = resolve(serverConfig.serverRootFolder, cacheFolder);
            }
            ensureDirSync(this._cacheFolder);
            this._logger.info('Using asset cache folder:', this._cacheFolder);
        }
    }

    async processAssetFromUri(assetUri: string, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<MashroomContentAssetProc> {
        let cacheFilePath = undefined;
        if (this.cacheEnable) {
            cacheFilePath = resolve(this._cacheFolder, this._getCacheKey(assetUri, resize, convert));
            try {
                const cachedAsset = await this._readCacheEntry(cacheFilePath);
                if (cachedAsset) {
                    return cachedAsset;
                }
            } catch (e) {
                // Ignore
            }
        }

        let asset: MashroomContentAssetProc;
        if (assetUri.startsWith('http://') || assetUri.startsWith('https://')) {
            asset = await this._fetchHttpAsset(assetUri);
        } else {
            asset = await this._fetchFileAsset(assetUri);
        }

        // Image processing
        if (asset.meta.mimeType.startsWith('image/')) {
            const newMimeType = convert?.format ? lookupMimeType(convert.format) || '' : asset.meta.mimeType;
            asset = {
                stream: await this.processAsset(asset.stream, resize, convert),
                meta: {
                    ...asset.meta,
                    mimeType: newMimeType,
                    size: undefined,
                }
            }
        }

        if (cacheFilePath) {
            this._logger.debug('Putting asset to cache:', assetUri);
            // Deliberately don't wait
            await this._writeCacheEntry(cacheFilePath, asset);
        }
        return asset;
    }

    async processAsset(asset: Readable, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<Readable> {
        if (!resize?.width && !resize?.height && !convert?.format) {
            return asset;
        }

        const procs: Array<Duplex> = [];
        if (convert?.format) {
            const {format, quality} = convert;
            procs.push(sharp().toFormat(format, {
                quality: quality || this.defaultQuality,
            }));
        }
        if (resize?.width || resize?.height) {
            const {width, height, fit = 'cover'} = resize;
            procs.push(sharp().resize(width, height, {
                withoutEnlargement: !this.scaleUp,
                fit,
            }));
        }

        return procs.reduce((stream, proc) => stream.pipe(proc), asset);
    }

    private async _fetchFileAsset(fileUri: string): Promise<MashroomContentAssetProc> {
        const filePath = fileUri.replace('file://', '');
        let fileStats;
        try {
            fileStats = statSync(filePath);
        } catch (e) {
            throw new Error(`File asset not found: ${fileUri}`);
        }

        const stream = createReadStream(filePath);
        const mimeType = lookupMimeType(filePath) || '';
        const filename = basename(filePath);

        return {
            stream,
            meta: {
                size: fileStats.size,
                mimeType,
                filename,
            }
        }
    }

    private async _fetchHttpAsset(httpUri: string): Promise<MashroomContentAssetProc> {
        const response = await fetch(httpUri);
        if (!response.ok) {
            throw new Error(`Http asset not found: ${  httpUri}`);
        }

        const stream = new Readable().wrap(response.body);

        const mimeType = response.headers.get('content-type') || '';
        const sizeHeader = response.headers.get('content-length');
        const contentDispositionHeader = response.headers.get('content-disposition');
        const expiresHeader = response.headers.get('expires');
        const cacheControlHeader = response.headers.get('cache-control');

        const size = sizeHeader ? parseInt(sizeHeader) : undefined;
        let filename;
        if (contentDispositionHeader) {
            filename = contentDispositionHeader.split(';').find((s) => s.trim().startsWith('filename='))?.split('=')[1].replace(/"/g, '');
        }
        if (!filename) {
            filename = basename(new URL(httpUri).pathname);
        }
        let expires;
        if (expiresHeader) {
            try {
                expires = new Date(expiresHeader).getTime();
            } catch (e) {
                // Ignore
            }
        }
        if (!expires && cacheControlHeader) {
            try {
                const maxAgeStr = cacheControlHeader.split(',').find((s) => s.trim().startsWith('max-age='))?.split('=')[1];
                if (maxAgeStr) {
                    expires = Date.now() + parseInt(maxAgeStr) * 1000;
                }
            } catch (e) {
                // Ignore
            }
        }

        return {
            stream,
            meta: {
                size,
                mimeType,
                filename,
                expires,
            }
        }
    }

    private async _writeCacheEntry(cacheFilePath: string, asset: MashroomContentAssetProc): Promise<void> {
        writeJSONSync(`${cacheFilePath}_meta.json`, asset.meta);
        asset.stream.pipe(createWriteStream(cacheFilePath), {
            end: false,
        });
    }

    private async _readCacheEntry(cacheFilePath: string): Promise<MashroomContentAssetProc | undefined> {
        let cacheFileStat;
        try {
            cacheFileStat = statSync(cacheFilePath);
        } catch (e) {
            return;
        }

        const metaFromCacheEntry: MashroomContentAssetProcMeta = readJSONSync(`${cacheFilePath}_meta.json`);
        const expires = metaFromCacheEntry.expires ??  cacheFileStat.mtimeMs + this.cacheDefaultTTLSec * 1000;

        if (expires > Date.now()) {
            this._logger.debug('Loading asset from cache:', cacheFilePath);
            const meta = {
                ...metaFromCacheEntry,
                size: cacheFileStat.size,
            }
            const stream = createReadStream(cacheFilePath);
            return {
                stream,
                meta,
            }
        }
        return undefined;
    }

    private _getCacheKey(assetUri: string, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert) {
        const resizeJson = resize ? JSON.stringify({...resize}) : '';
        const convertJson = convert ? JSON.stringify({...convert}) : '';
        return createHash('sha256')
            .update(`${assetUri  }_${  resizeJson  }_${  convertJson}`)
            .digest('base64')
            .replace(/[/=+]/g, '__');
    }

}
