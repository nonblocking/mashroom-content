
import {isAbsolute, resolve} from 'path';
import {createHash} from 'crypto';
import {Worker} from 'worker_threads';
import {ensureDirSync} from 'fs-extra';
import {lookup as lookupMimeType} from 'mime-types';
import fetchFileAsset from './fetchFileAsset';
import fetchHttpAsset from './fetchHttpAsset';
import processAsset from './processAsset';
import {readCacheEntry, writeCacheEntry} from './cache';
import type {Readable} from 'stream';

import type {MashroomLogger, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomContentAssetProcResult,
    MashroomContentAssetProcService,
    MashroomContentAssetProcImageConvert,
    MashroomContentAssetProcImageResize,
} from '../type-definitions';
import type {ImageProcessingWorkerData, ImageProcessingWorkerResult} from './imageProcessingWorker';

export default class MashroomContentAssetProcServiceImpl implements MashroomContentAssetProcService {

    private _cacheFolder = '/tmp';
    private _currentlyProcessedAssets: Record<string, boolean> = {};
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

    async processAssetFromUri(assetUri: string, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<MashroomContentAssetProcResult> {
        const cacheFilePath = resolve(this._cacheFolder, this._getCacheKey(assetUri, resize, convert));
        const assetHash = Buffer.from(cacheFilePath).toString('base64');

        if (this.cacheEnable) {
            try {
                const cachedAsset = await readCacheEntry(cacheFilePath, this.cacheDefaultTTLSec, this._logger);
                if (cachedAsset) {
                    return cachedAsset;
                }
            } catch (e) {
                // Ignore
            }
        }

        let asset: MashroomContentAssetProcResult;
        if (assetUri.startsWith('http://') || assetUri.startsWith('https://')) {
            asset = await fetchHttpAsset(assetUri);
        } else {
            asset = await fetchFileAsset(assetUri);
        }

        // Image processing
        if (asset.meta.mimeType.startsWith('image/') && (convert || resize)) {
            if (!this.cacheEnable) {
                // If caching is disabled, process directly (can take a long time)
                try {
                    const newMimeType = convert?.format ? lookupMimeType(convert.format) || '' : asset.meta.mimeType;
                    asset = {
                        stream: await this.processAsset(asset.stream, resize, convert),
                        meta: {
                            ...asset.meta,
                            mimeType: newMimeType,
                            size: undefined,
                        }
                    }
                } catch (e) {
                    this._logger.error('Image processing failed!', e);
                }
            } else {
                // Otherwise, process in the background and put it into cache and return the original image
                if (!this._currentlyProcessedAssets[assetHash]) {
                    this._currentlyProcessedAssets[assetHash] = true;
                    const workerData: ImageProcessingWorkerData = {
                        assetUri,
                        defaultQuality: this.defaultQuality,
                        scaleUp: this.scaleUp,
                        resize,
                        convert,
                        cacheFilePath,
                    }
                    this._logger.debug(`Converting image ${assetUri}`, resize, convert);
                    const worker = new Worker(resolve(__dirname, 'imageProcessingWorker'), {
                        workerData,
                    });
                    worker.on('message', (message: ImageProcessingWorkerResult) => {
                        delete this._currentlyProcessedAssets[assetHash];
                        this._logger.debug(`Image converted: ${assetUri}`);
                        if (!message.success) {
                            this._logger.error('Image processing failed!', message.message, message.stack);
                        }
                    });
                }
            }
        } else if (this.cacheEnable) {
            // Put even non-processed assets in cache
            writeCacheEntry(cacheFilePath, asset);
        }

        return asset;
    }

    async processAsset(asset: Readable, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<Readable> {
        return processAsset(asset, this.defaultQuality, this.scaleUp, resize, convert);
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
