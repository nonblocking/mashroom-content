import {createReadStream, statSync} from 'fs';
import {basename} from 'path';
import {lookup as lookupMimeType} from 'mime-types';

import type {MashroomContentAssetProcResult} from '../type-definitions';

export default async (fileUri: string): Promise<MashroomContentAssetProcResult> => {
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
