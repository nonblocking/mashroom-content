import {createReadStream, createWriteStream, statSync} from 'fs';
import {readJSONSync, writeJSONSync} from 'fs-extra';

import type {MashroomContentAssetProcResult, MashroomContentAssetProcMeta} from '../type-definitions';
import type {MashroomLogger} from '@mashroom/mashroom/type-definitions';

export const writeCacheEntry = async (cacheFilePath: string, asset: MashroomContentAssetProcResult): Promise<void> => {
    writeJSONSync(`${cacheFilePath}_meta.json`, asset.meta);
    asset.stream.pipe(createWriteStream(cacheFilePath), {
        end: false,
    });
}

export const readCacheEntry = async (cacheFilePath: string, cacheDefaultTTLSec: number, logger: MashroomLogger): Promise<MashroomContentAssetProcResult | undefined> => {
    let cacheFileStat;
    try {
        cacheFileStat = statSync(cacheFilePath);
    } catch (e) {
        return;
    }

    const metaFromCacheEntry: MashroomContentAssetProcMeta = readJSONSync(`${cacheFilePath}_meta.json`);
    const expires = metaFromCacheEntry.expires ?? cacheFileStat.mtimeMs + cacheDefaultTTLSec * 1000;

    if (expires > Date.now()) {
        logger.debug('Loading asset from cache:', cacheFilePath);
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

