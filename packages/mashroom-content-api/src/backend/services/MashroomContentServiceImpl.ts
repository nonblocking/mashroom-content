
import context from '../context';
import checkFilter from './check_filter';
import checkLocale from './check_locale';

import type {Readable} from 'stream';
import type {Request} from 'express';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {MashroomMemoryCacheService} from '@mashroom/mashroom-memory-cache/type-definitions';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';
import type {
    MashroomContentApiFilter,
    MashroomContentApiStatus,
    MashroomContentService,
    MashroomContentProvider,
    MashroomContentApiContentWrapper,
    MashroomContentApiSort,
    MashroomContentApiContentSearchResult,
    MashroomContentApiContentUpdateInsert,
    MashroomContentAsset,
    MashroomContentUrlRewriteService,
    MashroomContentAssetContentRef,
    MashroomContentVersionsResult,
    MashroomContentAssetMeta,
    MashroomContentAssetSearchResult,
} from '../../../type-definitions';
import type {MashroomContentProviderRegistry} from '../../../type-definitions/internal';

const CACHE_REGION = 'mashroom-content';

export default class MashroomContentServiceImpl implements MashroomContentService {

    constructor(private _providerName: string, private _contentProviderRegistry: MashroomContentProviderRegistry,
                private _cacheEnable: boolean, private _cacheTTLSec: number, private _devMode: boolean) {
    }

    get imageBreakpoints() {
        return context.imageBreakpoints;
    }

    get imagePreferredFormats() {
        return context.imagePreferredFormats;
    }

    async searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus,
                           sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>> {
        if (filter && !checkFilter(filter)) {
            throw new Error(`Invalid filter: ${JSON.stringify(filter, null, 2)}`);
        }
        if (locale && !checkLocale(locale)) {
            throw new Error(`Invalid locale: ${locale}`);
        }

        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        const cacheKey = this._getCacheKey(req, 'search', {type, filter, locale, sort, limit, skip});
        if (cacheKey && cacheService) {
            const cachedResult = await cacheService.get(CACHE_REGION, cacheKey);
            if (cachedResult) {
                return cachedResult as MashroomContentApiContentSearchResult<T>;
            }
        }
        const searchResult = await this._getProvider().searchContent(req, type, filter, locale || this._getDefaultLocale(req), status, sort, limit, skip);
        searchResult.hits.forEach((content) => this._rewriteContent(req, content.data));
        if (cacheKey && cacheService) {
            cacheService.set(CACHE_REGION, cacheKey, searchResult);
        }
        return searchResult;
    }

    async getContent<T>(req: Request, type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>> {
        if (locale && !checkLocale(locale)) {
            throw new Error(`Invalid locale: ${locale}`);
        }

        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        const cacheKey = this._getCacheKey(req, 'get', {type, id, locale, version});
        if (cacheKey && cacheService) {
            const cachedResult = await cacheService.get(CACHE_REGION, cacheKey);
            if (cachedResult) {
                return cachedResult as MashroomContentApiContentWrapper<T>;
            }
        }
        const content = await this._getProvider().getContent(req, type, id, locale || this._getDefaultLocale(req), version);
        const rewrittenContent = this._rewriteContent(req, content.data);
        if (cacheKey && cacheService) {
            cacheService.set(CACHE_REGION, cacheKey, rewrittenContent);
        }
        return {
            ...content,
            data: this._rewriteContent(req, content.data),
        };
    }

    async getContentVersions<T>(req: Request, type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>> {
        if (locale && !checkLocale(locale)) {
            throw new Error(`Invalid locale: ${locale}`);
        }

        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        const cacheKey = this._getCacheKey(req, 'versions', {type, id, locale});
        if (cacheKey && cacheService) {
            const cachedResult = await cacheService.get(CACHE_REGION, cacheKey);
            if (cachedResult) {
                return cachedResult as MashroomContentVersionsResult<T>;
            }
        }
        let result = await this._getProvider().getContentVersions<T>(req, type, id, locale || this._getDefaultLocale(req));
        result = {
            ...result,
            versions: result.versions.map((content) => ({
                ...content,
                data: this._rewriteContent(req, content.data),
            })),
        };
        if (cacheKey && cacheService) {
            cacheService.set(CACHE_REGION, cacheKey, result);
        }
        return result;
    }

    async insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>> {
        if (content.meta?.locale && !checkLocale(content.meta.locale)) {
            throw new Error(`Invalid locale: ${content.meta.locale}`);
        }

        this._rewriteContent(req, content.data, true);
        if (!content.meta?.locale) {
            content = {
                ...content,
                meta: {
                    ...content.meta,
                    locale: this._getDefaultLocale(req),
                }
            }
        }
        const insertedContent = await this._getProvider().insertContent(req, type, content);
        return {
            ...insertedContent,
            data: this._rewriteContent(req, insertedContent.data),
        };
    }

    async updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>> {
        if (content.meta?.locale && !checkLocale(content.meta.locale)) {
            throw new Error(`Invalid locale: ${content.meta.locale}`);
        }

        this._rewriteContent(req, content.data, true);
        if (!content.meta?.locale) {
            content = {
                ...content,
                meta: {
                    ...content.meta,
                    locale: this._getDefaultLocale(req),
                }
            }
        }
        const updatedContent = await this._getProvider().updateContent(req, type, id, content);

        // Invalidate cache
        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        await cacheService?.clear(CACHE_REGION);

        return {
            ...updatedContent,
            data: this._rewriteContent(req, updatedContent.data),
        };
    }

    async removeContent(req: Request, type: string, id: string): Promise<void> {
        await this._getProvider().removeContent(req, type, id);
        // Invalidate cache
        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        await cacheService?.clear(CACHE_REGION);
    }

    async removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void> {
        if (!locales && !versions) {
            return;
        }
        if (locales) {
            locales.forEach((locale) => {
                if (!checkLocale(locale)) {
                    throw new Error(`Invalid locale: ${locale}`);
                }
            })
        }

        await this._getProvider().removeContentParts(req, type, id, locales, versions);
        // Invalidate cache
        const cacheService: MashroomMemoryCacheService = req.pluginContext.services.memorycache?.service;
        await cacheService?.clear(CACHE_REGION);
    }

    async uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset> {
        const urlRewriteService: MashroomContentUrlRewriteService = req.pluginContext.services.content!.rewrite;
        const result = await this._getProvider().uploadAsset(req, file, meta, path, contentRef);
        const rewrittenResult = {
            ...result,
            url: urlRewriteService.rewriteUrl(req, result.url),
        }
        return rewrittenResult;
    }

    async searchAssets(req: Request, type: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult> {
        const urlRewriteService: MashroomContentUrlRewriteService = req.pluginContext.services.content!.rewrite;
        const result = await this._getProvider().searchAssets(req, type, titleContains, limit, skip);
        const rewrittenResult = {
            hits: result.hits.map(({id, url, meta}) => ({
                id,
                url: urlRewriteService.rewriteUrl(req, url),
                meta,
            })),
            meta: result.meta,
        }
        return rewrittenResult;
    }

    async removeAsset(req: Request, id: string): Promise<void> {
        await this._getProvider().removeAsset(req, id);
    }

    private _rewriteContent(req: Request, content: any, reverse = false): any {
        const urlRewriteService: MashroomContentUrlRewriteService = req.pluginContext.services.content!.rewrite;
        Object.keys(content).forEach((propName) => {
            const prop = content[propName];
            if (!propName.startsWith('_')) {
                if (typeof (prop) === 'string') {
                    content[propName] = urlRewriteService.rewriteContent(req, content[propName], reverse);
                } else if (Array.isArray(prop) || typeof (prop) === 'object') {
                    this._rewriteContent(req, prop, reverse);
                }
            }
        });
        return content;
    }

    private _getProvider(): MashroomContentProvider {
        const provider = this._contentProviderRegistry.getContentProvider(this._providerName);
        if (!provider) {
            throw new Error(`Content provider '${this._providerName}' not found!`);
        }
        return provider;
    }

    private _getDefaultLocale(req: Request): string {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n?.service;
        if (i18nService) {
            return i18nService.getLanguage(req);
        }
        return 'en';
    }

    private _getCacheKey(req: Request, prefix: string, args: any): string | undefined {
        if (this._devMode || !this._cacheEnable) {
            return;
        }

        // The frontend base path must be part of the cache key because it determines how the asset URLs are rewritten
        let frontendPath = '';
        const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper?.service;
        const mappingInfo = pathMapperService?.getMappingInfo(req);
        if (mappingInfo) {
            frontendPath = mappingInfo.frontendBasePath;
        }
        return Buffer.from(`__${prefix}__${frontendPath}__${JSON.stringify({...args})}`).toString('base64');
    }
}
