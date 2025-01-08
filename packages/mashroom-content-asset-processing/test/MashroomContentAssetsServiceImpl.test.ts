
jest.setTimeout(30000);

import {resolve} from 'path';
import {writeFileSync} from 'fs';
import nock from 'nock';
import imageSizeOf from 'image-size';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import MashroomContentAssetProcServiceImpl from '../src/MashroomContentAssetProcServiceImpl';

describe('MashroomContentAssetsServiceImpl', () => {

    const pluginContext: any = {
        loggerFactory: dummyLoggerFactory,
        serverConfig: {
            serverRootFolder: __dirname,
        },
        serverInfo: {
            devMode: false,
        }
    };
    const pluginContextHolder = {
        getPluginContext: () => pluginContext,
    };

    it('fetches a file asset and processes it', async () => {
        const service = new MashroomContentAssetProcServiceImpl(false, 75, false, 0, '.', pluginContextHolder);

        const asset = await service.processAssetFromUri(
            `file://${resolve(__dirname, 'assets', 'mashroom_portal_ui.png')}`,
            {width: 600},
            {format: 'webp'});
        const assetBuffer = await new Promise<Buffer>((resolve) => {
            const buffers: Array<any> = [];
            asset.stream.on('data', d => buffers.push(d));
            asset.stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        expect(asset.meta).toBeTruthy();
        expect(asset.meta.mimeType).toBe('image/webp');
        expect(asset.meta.size).toBeFalsy();
        expect(asset.meta.filename).toBe('mashroom_portal_ui.png');
        expect(imageSizeOf(assetBuffer)).toEqual({
            height: 392,
            type: 'webp',
            width: 600,
        });
    });

    it('fetches a http asset and processes it', async () => {
        nock('http://localhost:9999')
            .get('/assets/mashroom_portal_ui.png?foo=bar')
            .replyWithFile(200, `${resolve(__dirname, 'assets', 'mashroom_portal_ui.png')}`, {
                'content-type': 'image/png',
                'content-length': '12345',
                'cache-control': 'max-age=31536000, public',
                expires: 'Mon, 30 Jan 2023 09:54:50 GMT',
                'content-disposition': 'inline; filename="mashroom_portal_ui_v3.png"',
            });

        const service = new MashroomContentAssetProcServiceImpl(false, 75, false, 0, '.', pluginContextHolder);

        const asset = await service.processAssetFromUri(
            'http://localhost:9999/assets/mashroom_portal_ui.png?foo=bar',
            {width: 600},
            {format: 'webp'});
        const assetBuffer = await new Promise<Buffer>((resolve) => {
            const buffers: Array<any> = [];
            asset.stream.on('data', d => buffers.push(d));
            asset.stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        expect(asset.meta).toBeTruthy();
        expect(asset.meta.mimeType).toBe('image/webp');
        expect(asset.meta.size).toBeFalsy();
        expect(asset.meta.expires).toBe(1675072490000);
        expect(asset.meta.filename).toBe('mashroom_portal_ui_v3.png');
        expect(imageSizeOf(assetBuffer)).toEqual({
            height: 392,
            type: 'webp',
            width: 600,
        });
    });

    /*
    it('caches fetched assets', async () => {
        const tmpDir = mkdtempSync('mashroom_content_assets_');

        const service = new MashroomContentAssetProcServiceImpl(false, 75, true, 60, tmpDir, pluginContextHolder);
        emptyDirSync(tmpDir);

        await service.processAssetFromUri(
            `file://${resolve(__dirname, 'assets', 'mashroom_portal_ui.png')}`,
            {width: 600},
            {format: 'webp'});

        const cachedFiles = await readdir(tmpDir);

        expect(cachedFiles.length).toBe(2);
    });
     */

    it('loads cached assets', async () => {
        const service = new MashroomContentAssetProcServiceImpl(false, 75, true, 60, './asset-cache', pluginContextHolder);

        const assetUri = `file://${resolve(__dirname, 'assets', 'cached_image.png')}`;
        // @ts-ignore
        const cacheKey = service._getCacheKey(assetUri);
        // @ts-ignore
        writeFileSync(resolve(service._cacheFolder, `${cacheKey}_meta.json`), JSON.stringify({}));
        // @ts-ignore
        writeFileSync(resolve(service._cacheFolder, cacheKey), 'test');

        const asset = await service.processAssetFromUri(assetUri);
        const assetBuffer = await new Promise<Buffer>((resolve) => {
            const buffers: Array<any> = [];
            asset.stream.on('data', d => buffers.push(d));
            asset.stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        expect(assetBuffer.toString('utf-8')).toBe('test');
    });


    it('supports avif', async () => {
        const service = new MashroomContentAssetProcServiceImpl(false, 75, false, 0, '.', pluginContextHolder);

        const asset = await service.processAssetFromUri(
            `file://${resolve(__dirname, 'assets', 'mashroom_portal_ui.png')}`,
            {width: 600},
            {format: 'avif'});
        const assetBuffer = await new Promise<Buffer>((resolve) => {
            const buffers: Array<any> = [];
            asset.stream.on('data', d => buffers.push(d));
            asset.stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        expect(asset.meta).toBeTruthy();
        expect(asset.meta.mimeType).toBe('image/avif');
        expect(asset.meta.size).toBeFalsy();
        expect(asset.meta.filename).toBe('mashroom_portal_ui.png');
        expect(assetBuffer).toBeTruthy();
    });

    it('supports change of aspect ratio', async () => {
        const service = new MashroomContentAssetProcServiceImpl(false, 75, false, 0, '.', pluginContextHolder);

        const asset = await service.processAssetFromUri(
            `file://${resolve(__dirname, 'assets', 'mashroom_portal_ui.png')}`,
            {width: 600, height: 600, fit: 'cover'});
        const assetBuffer = await new Promise<Buffer>((resolve) => {
            const buffers: Array<any> = [];
            asset.stream.on('data', d => buffers.push(d));
            asset.stream.on('end', () => {
                resolve(Buffer.concat(buffers));
            });
        });

        expect(asset.meta).toBeTruthy();
        expect(asset.meta.mimeType).toBe('image/png');
        expect(asset.meta.size).toBeFalsy();
        expect(asset.meta.filename).toBe('mashroom_portal_ui.png');
        expect(imageSizeOf(assetBuffer)).toEqual({
            height: 600,
            type: 'png',
            width: 600,
        });
    });


});
