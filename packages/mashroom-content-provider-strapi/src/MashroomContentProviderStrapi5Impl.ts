
import {stringify as stringifyQuery} from 'qs';
import fetch from 'node-fetch';
import FormData from 'form-data';

import type {Readable} from 'stream';
import type {Request} from 'express';
import type {
    MashroomContentApiAssetProxyConfigs,
    MashroomContentApiContentSearchResult,
    MashroomContentApiContentUpdateInsert,
    MashroomContentApiContentWrapper,
    MashroomContentApiError,
    MashroomContentApiFilter,
    MashroomContentApiSort,
    MashroomContentApiStatus,
    MashroomContentAssetContentRef,
    MashroomContentAssetMeta,
    MashroomContentAsset,
    MashroomContentProvider,
    MashroomContentAssetSearchResult,
    MashroomContentVersionsResult,
} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {
    StrapiUpload,
    StrapiUploads,
    StrapiContent,
    StrapiContentSearchResult,
    StrapiContentInsert,
    StrapiContentUpdate,
    StrapiContentWrapper,
} from '../type-definitions';

const UPLOADS_URL_PREFIX = '/upload';

// API reference: https://docs.strapi.io/developer-docs/latest/developer-resources/database-apis-reference/rest-api.html
export default class MashroomContentProviderStrapi4Impl implements MashroomContentProvider {

    constructor(private strapiUrl: string, private apiToken: string) {
    }

    async searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus, sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        const query: any = {};
        if (filter) {
            query.filters = this.mapToStrapiFilter(filter);
        }
        if (locale) {
            query.locale = locale;
        }
        if (status == 'published') {
            query.publicationState = 'live';
        } else if (status === 'draft') {
            query.publicationState = 'preview';
        }
        if (sort) {
            query.sort = Object.keys(sort).map((propName) => `${propName}:${(sort as MashroomContentApiSort<any>)[propName]}`);
        }
        if (limit) {
            query.pagination = {
                limit,
                start: skip || 0,
            };
        }

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/${type}?${stringifyQuery(query)}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                }
            });
        } catch (e) {
            logger.error('Searching content failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Searching content failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            const searchResult = await result.json() as StrapiContentSearchResult<T>;
            return {
                hits: searchResult.data.map((h) => this.mapFromStrapiContent(h, locale)),
                meta: {
                    total: searchResult.meta.pagination.total,
                }
            };
        } catch (e) {
            logger.error('Searching content failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async getContent<T>(req: Request, type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        const content = await this.getStrapiContent<T>(req, type, id);

        try {
            return this.mapFromStrapiContent(content.data, locale);
        } catch (e) {
            logger.error(`Finding content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async getContentVersions<T>(req: Request, type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>> {
        const error: MashroomContentApiError = 'Not implemented';
        throw new Error(error);
    }

    async insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        const data: StrapiContentInsert<T> = {
            data: {
                ...content.data,
                locale: content.meta?.locale,
            }
        };

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify(data),
            });
        } catch (e) {
            logger.error(`Adding content ${type} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Adding content ${type} failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            const content = await result.json() as StrapiContentWrapper<T>;
            return this.mapFromStrapiContent(content.data);
        } catch (e) {
            logger.error(`Adding content ${type} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        const targetLocale = content.meta?.locale;
        const existingEntry: StrapiContent<T> = (await this.getStrapiContent<T>(req, type, id)).data;
        const currentAvailableLocales = this.getAvailableLocales(existingEntry);

        const data: StrapiContentUpdate<T> = {
            data: {
                ...content.data,
            }
        };

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/${type}/${id}${targetLocale ? `?locale=${targetLocale}`: ''}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiToken}`,
                },
                body: JSON.stringify(data),
            });
        } catch (e) {
            logger.error(`Updating content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Updating content ${type}:${id} failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            const content = await result.json() as StrapiContentWrapper<T>;
            const mappedContent = this.mapFromStrapiContent(content.data);
            if (targetLocale && currentAvailableLocales.indexOf(targetLocale) === -1) {
                currentAvailableLocales.push(targetLocale);
            }
            return {
                ...mappedContent,
                meta: {
                    ...mappedContent.meta,
                    availableLocales: currentAvailableLocales,
                }
            };
        } catch (e) {
            logger.error(`Updating content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async removeContent(req: Request, type: string, id: string): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        // Check if the entry exists
        await this.getStrapiContent<any>(req, type, id);

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/${type}/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                },
            });
        } catch (e) {
            logger.error(`Removing content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Removing content ${type}:${id} with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        if (versions) {
            const error: MashroomContentApiError = 'Not implemented';
            throw new Error(error);
        }
        if (locales) {
            for (let i = 0; i < locales.length; i++) {
                const locale = locales[i];
                let result;
                try {
                    result = await fetch(`${this.strapiUrl}/api/${type}/${id}?locale=${locale}`, {
                        method: 'DELETE',
                        headers: {
                            Authorization: `Bearer ${this.apiToken}`,
                        },
                    });
                } catch (e) {
                    logger.error(`Removing content ${type}:${id} failed!`, e);
                    const error: MashroomContentApiError = 'Provider Internal Error';
                    throw new Error(error);
                }
                if (result.status === 403) {
                    const error: MashroomContentApiError = 'Access Denied';
                    throw new Error(error);
                } else if (!result.ok) {
                    logger.error(`Removing content ${type}:${id} with status ${result.status}`);
                    const error: MashroomContentApiError = 'Provider Internal Error';
                    throw new Error(error);
                }
            }
        }
    }

    async uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');
        logger.debug('Uploading file to Strapi:', meta.fileName);

        const formData = new FormData();
        formData.append('files', file, { filename: meta.fileName });
        formData.append('fileInfo', JSON.stringify({ name: meta.fileName, caption: meta.fileName }));
        if (path) {
            formData.append('path', path);
        }
        if (contentRef?.type) {
            formData.append('ref', contentRef?.type);
        }
        if (contentRef?.id) {
            formData.append('refId', contentRef?.id);
        }
        if (contentRef?.fieldName) {
            formData.append('field', contentRef?.fieldName);
        }
        // TODO: contentRef.locale ??

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/upload`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                },
                body: formData,
            });
        } catch (e) {
            logger.error('Uploading asset failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Searching assets failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            const uploadedAssets = await result.json() as StrapiUploads;
            return this.mapAsset(uploadedAssets[0]);
        } catch (e) {
            logger.error('Uploading asset failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async searchAssets(req: Request, type?: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        const query: any = {};
        if (type) {
            query.filters = {};
            query.filters.mime = {
                $containsi: type,
            };
        }
        if (titleContains) {
            if (!query.filters) {
                query.filters = {};
            }
            query.filters.caption = {
                $containsi: titleContains,
            };
        }
        // Always sort by creation timestamp
        query.sort = ['createdAt:desc'];

        logger.debug('Searching for assets with query:', query);

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/upload/files?${stringifyQuery(query)}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                }
            });
        } catch (e) {
            logger.error('Searching assets failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Searching assets failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            const assets = await result.json() as StrapiUploads;

            const total = assets.length;

            // The Media Library API does support paging but does not deliver the total count,
            // so, we fetch just everything and extract the wanted slice, even if this is very inefficient.
            let hits = assets;
            if (limit || skip) {
                hits = assets.slice(skip || 0, limit ? (skip || 0) + limit : undefined);
            }

            return {
                hits: hits.map(this.mapAsset),
                meta: {
                    total,
                }
            };
        } catch (e) {
            logger.error('Searching assets failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    async removeAsset(req: Request, id: string): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');
        logger.debug('Removing asset:', id);

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/upload/files/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                }
            });
        } catch (e) {
            logger.error('Removing asset failed!', e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        }
    }

    getAssetProxies(): MashroomContentApiAssetProxyConfigs {
        return {
            p1: {
                urlPrefix: UPLOADS_URL_PREFIX,
                allowImageProcessing: true,
                toFullUri: (path) => {
                    const cleanPath = path.split('?')[0];
                    return `${this.strapiUrl}${cleanPath}`;
                },
            },
            p2: {
                urlPrefix: `${this.strapiUrl}${UPLOADS_URL_PREFIX}`,
                allowImageProcessing: true,
                toFullUri: (path) => {
                    return path.split('?')[0];
                },
            }
        };
    }

    private async getStrapiContent<T>(req: Request, type: string, id: string): Promise<StrapiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.strapi');

        let result;
        try {
            result = await fetch(`${this.strapiUrl}/api/${type}/${id}?populate=localizations`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                }
            });
        } catch (e) {
            logger.error(`Finding content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
        if (result.status === 403) {
            const error: MashroomContentApiError = 'Access Denied';
            throw new Error(error);
        } else if (result.status === 404) {
            const error: MashroomContentApiError = 'Not Found';
            throw new Error(error);
        } else if (!result.ok) {
            logger.error(`Finding content ${type}:${id} failed with status ${result.status}`);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }

        try {
            return await result.json() as StrapiContentWrapper<T>;
        } catch (e) {
            logger.error(`Finding content ${type}:${id} failed!`, e);
            const error: MashroomContentApiError = 'Provider Internal Error';
            throw new Error(error);
        }
    }

    private getAvailableLocales(content: StrapiContent<unknown>): Array<string> {
        const availableLocales: Array<string> = [];
        if (content.locale) {
            availableLocales.push(content.locale);
        }

        if (content.localizations) {
            content.localizations.forEach((c: StrapiContent<unknown>) => {
                if (c.locale && availableLocales.indexOf(c.locale) === -1) {
                    availableLocales.push(c.locale);
                }
            });
        }
        return availableLocales;
    }

    private mapFromStrapiContent<T>(content: StrapiContent<T>, wantedLocale?: string): MashroomContentApiContentWrapper<T> {
        const availableLocales = this.getAvailableLocales(content);

        if (wantedLocale && content.localizations) {
            // Find wanted locale
            const i18nContent = content.localizations.find((c: StrapiContent<T>) => c.locale === wantedLocale);
            if (i18nContent) {
                content = i18nContent;
            }
        }

        const {id, documentId, locale, publishedAt, createdAt, updatedAt, localizations, ...otherAttributes} = content;
        return {
            id: documentId,
            data: otherAttributes as any,
            meta: {
                locale,
                createdAt,
                updatedAt,
                status: publishedAt ? 'published' : 'draft',
                availableLocales,
            },
        };
    }

    private mapAsset({id, url, caption, name, mime, size, width, height}: StrapiUpload): MashroomContentAsset {
        return {
            id,
            url,
            meta: {
                title: caption,
                fileName: name,
                mimeType: mime,
                size,
                width,
                height,
            }
        };
    }

    private mapToStrapiFilter<T>(filter: MashroomContentApiFilter<T>): any {
        const rewriteOperator = (op: string, target: any, parent: any): void => {
            switch (op) {
                case '$nin': {
                    parent['$notIn'] = target;
                    break;
                }
                case '$exists': {
                    parent['$notNull'] = target;
                    break;
                }
                default:
                    parent[op] = target;
            }
        };
        const map = (props: any): any => {
            if (!props ) {
                return props;
            }
            const result: any = {};
            Object.keys(props).forEach((propKey) => {
                const prop = props[propKey];
                let target;
                if (typeof prop === 'object') {
                    if (Array.isArray(prop)) {
                        target = prop.map(map);
                    } else {
                        target = map(prop);
                    }
                } else {
                    target = prop;
                }
                rewriteOperator(propKey, target, result);
            });
            return result;
        };
        return map(filter);
    }
}
