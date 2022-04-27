import {Readable} from 'stream';
import {basename} from 'path';
import {URL} from 'url';
import fetch from 'node-fetch';

import type {MashroomContentAssetProc} from '../type-definitions';

export default async (httpUri: string): Promise<MashroomContentAssetProc> => {
    const response = await fetch(httpUri);
    if (!response.ok) {
        throw new Error(`Http asset not found: ${httpUri}`);
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
