import type {Readable} from 'stream';

export type MashroomContentAssetProcImageFormats = 'png' | 'jpeg' | 'jpg' | 'webp' | 'avif';

export type MashroomContentAssetProcMeta = {
    readonly mimeType: string;
    readonly size?: number;
    readonly filename?: string;
    readonly expires?: number;
}

export type MashroomContentAssetProcResult = {
    readonly stream: Readable;
    readonly meta: MashroomContentAssetProcMeta;
}

// See https://sharp.pixelplumbing.com/api-resize
export type MashroomContentAssetProcFit = 'cover' | 'contain' | 'fill' | 'inside' | 'outside';

export type MashroomContentAssetProcImageResize = {
    width?: number;
    height?: number;
    fit?: MashroomContentAssetProcFit;
}

export type MashroomContentAssetProcImageConvert = {
    format?: MashroomContentAssetProcImageFormats;
    quality?: number;
}

export interface MashroomContentAssetProcService {
    /**
     * Process and return given asset from URI - result will be cached
     */
    processAssetFromUri(assetUri: string, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<MashroomContentAssetProcResult>;

    /**
     * Process given asset
     */
    processAsset(asset: Readable, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<Readable>;
}
