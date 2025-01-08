
import {workerData, parentPort} from 'worker_threads';
import {lookup as lookupMimeType} from 'mime-types';
import fetchHttpAsset from './fetchHttpAsset';
import fetchFileAsset from './fetchFileAsset';
import processAsset from './processAsset';
import {writeCacheEntry} from './cache';
import type {MashroomContentAssetProcResult, MashroomContentAssetProcImageConvert, MashroomContentAssetProcImageResize} from '../type-definitions';

// Processes an image and puts it into cache
// Supposed to run in a worker thread

export type ImageProcessingWorkerData = {
    assetUri: string;
    defaultQuality: number;
    scaleUp: boolean;
    resize?: MashroomContentAssetProcImageResize;
    convert?: MashroomContentAssetProcImageConvert;
    cacheFilePath: string;
}

export type ImageProcessingWorkerResult = {
    success: boolean;
    message?: string;
    stack?: string;
}

const params: ImageProcessingWorkerData = workerData;

const processAssetAndPutToCache = async () => {
    try {

        // Read asset
        let asset: MashroomContentAssetProcResult;
        if (params.assetUri.startsWith('http://') || params.assetUri.startsWith('https://')) {
            asset = await fetchHttpAsset(params.assetUri);
        } else {
            asset = await fetchFileAsset(params.assetUri);
        }

        // Process
        const newMimeType = params.convert?.format ? lookupMimeType(params.convert.format) || '' : asset.meta.mimeType;
        asset = {
            stream: await processAsset(asset.stream, params.defaultQuality, params.scaleUp, params.resize, params.convert),
            meta: {
                ...asset.meta,
                mimeType: newMimeType,
                size: undefined,
            }
        };

        await writeCacheEntry(params.cacheFilePath, asset);

        parentPort?.postMessage({
            success: true
        } as ImageProcessingWorkerResult);
    } catch (e: any) {
        parentPort?.postMessage({
            success: false,
            message: e.message,
            stack: e.stack,
        } as ImageProcessingWorkerResult);
    }
};

processAssetAndPutToCache();
