
import MashroomContentProviderRegistry from '../plugins/MashroomContentProviderRegistry';
import type {MashroomContentAssetProcImageFormats} from '@mashroom-content/mashroom-content-asset-processing/type-definitions';

const _pluginRegistry = new MashroomContentProviderRegistry();
let _contentApiBasePath = '/content';
let _cacheEnable =  true;
let _cacheTTLSec = 1800;
let _imageBreakpoints: Array<number> = [];
let _imagePreferredFormats: Array<MashroomContentAssetProcImageFormats> = [];

export default {
    get pluginRegistry() {
        return _pluginRegistry;
    },
    get contentApiBasePath() {
        return _contentApiBasePath;
    },
    get cacheEnable() {
        return _cacheEnable;
    },
    get cacheTTLSec() {
        return _cacheTTLSec;
    },
    get imageBreakpoints() {
        return _imageBreakpoints;
    },
    get imagePreferredFormats() {
        return _imagePreferredFormats;
    },
    set contentApiBasePath(path: string) {
        _contentApiBasePath = path;
    },
    set cacheEnable(enable: boolean) {
        _cacheEnable = enable;
    },
    set cacheTTLSec(ttlSec: number) {
        _cacheTTLSec = ttlSec;
    },
    set imageBreakpoints(widths:  Array<number>) {
        _imageBreakpoints = widths;
    },
    set imagePreferredFormats(formats: Array<MashroomContentAssetProcImageFormats>) {
        _imagePreferredFormats = formats;
    },
};
