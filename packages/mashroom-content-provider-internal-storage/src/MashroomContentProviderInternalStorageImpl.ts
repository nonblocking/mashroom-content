
import {isAbsolute, resolve} from 'path';
import {createWriteStream, unlinkSync} from 'fs';
import {ensureDirSync} from 'fs-extra';
import {nanoid} from 'nanoid';
import {
    CONTENT_MASTER_ENTRY_COLLECTION_NAME,
    CONTENT_ENTRY_COLLECTION_PREFIX, ASSET_COLLECTION_NAME,
} from './constants';

import type {Readable} from 'stream';
import type {Request} from 'express';
import type {MashroomLoggerFactory} from '@mashroom/mashroom/type-definitions';
import type {MashroomI18NService} from '@mashroom/mashroom-i18n/type-definitions';
import type {
    MashroomStorageService,
    MashroomStorageCollection,
    MashroomStorageObjectFilter,
    MashroomStorageObject,
    MashroomStorageSort,
    MashroomStorageRecord,
} from '@mashroom/mashroom-storage/type-definitions';
import type {
    MashroomContentApiAssetProxyConfigs,
    MashroomContentApiContentSearchResult,
    MashroomContentApiContentUpdateInsert,
    MashroomContentApiContentWrapper,
    MashroomContentApiFilter,
    MashroomContentApiSort,
    MashroomContentApiStatus,
    MashroomContentAssetContentRef,
    MashroomContentAssetMeta,
    MashroomContentAsset,
    MashroomContentProvider,
    MashroomContentApiError,
    MashroomContentVersionsResult,
    MashroomContentAssetSearchResult,
} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {AssetEntry, ContentEntry, ContentMasterEntry} from '../type-definitions';

const DOWNLOADS_URL_PREFIX = '/downloads';

export default class MashroomContentProviderInternalStorageImpl implements MashroomContentProvider {

    #assetsFolder: string;

    constructor(assetsFolder: string, serverRootFolder: string, loggerFactory: MashroomLoggerFactory) {
        const logger = loggerFactory('mashroom.content.provider.internal-storage');

        if (!isAbsolute(assetsFolder)) {
            this.#assetsFolder = resolve(serverRootFolder, assetsFolder);
        } else {
            this.#assetsFolder = assetsFolder;
        }

        logger.info(`Content internal storage provider assets folder: ${this.#assetsFolder}`);
    }

    async searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus, sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>> {
        if (!locale) {
            locale = this.getDefaultLocale(req);
        }
        const entriesCollection = await this.getContentEntriesCollection(req, locale);

        const fullFilter: MashroomStorageObjectFilter<ContentEntry<any>> = {
            $and: [
                { _contentType: type },
                { _contentStatus: status || 'published' },
            ]
        };
        if (filter) {
            fullFilter.$and?.push(this.mapToStorageFilter(filter));
        }

        const {result, totalCount} = await entriesCollection.find(fullFilter, limit, skip, sort);
        const hits: Array<MashroomContentApiContentWrapper<T>> = result.map((e) => this.mapContentEntryToResult<any>(e, locale!));

        return {
            hits,
            meta: {
                total: totalCount,
            },
        };
    }

    async getContent<T>(req: Request, type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');
        const defaultLocale = this.getDefaultLocale(req);
        if (!locale) {
            locale = defaultLocale;
        }

        const entriesCollection = await this.getContentEntriesCollection(req, locale);

        const filter: MashroomStorageObjectFilter<ContentEntry<any>> = {
            $and: [
                { _contentType: type },
                { _contentId: id },
                ...(version ? [{ _contentVersion: version }] : [{_contentStatus: 'published'}]),
            ]
        };
        const entry = await entriesCollection.findOne(filter);
        if (entry) {
            return this.mapContentEntryToResult<any>(entry, locale);
        }

        // Check if we have the entry in the default lang
        const masterEntry = await this.getMasterEntry(req, type, id);
        // Check if we have an entry with the default language
        if (masterEntry && locale !== defaultLocale) {
            const defaultLangEntriesCollection = await this.getContentEntriesCollection(req, defaultLocale);
            const defaultLangEntry = await defaultLangEntriesCollection.findOne(filter);
            if (defaultLangEntry) {
                return this.mapContentEntryToResult<any>(defaultLangEntry, defaultLocale);
            }
        }

        logger.error(`Content not found: ${type}:${id}`);
        const error: MashroomContentApiError = 'Not Found';
        throw new Error(error);
    }

    async getContentVersions<T>(req: Request, type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');
        const defaultLocale = this.getDefaultLocale(req);
        if (!locale) {
            locale = defaultLocale;
        }

        const entriesCollection = await this.getContentEntriesCollection(req, locale);

        const filter: MashroomStorageObjectFilter<ContentEntry<any>> = {
            $and: [
                { _contentType: type },
                { _contentId: id },
            ]
        };
        const {result} = await entriesCollection.find(filter);
        if (result.length > 0) {
            return {
                versions: result.map((e) => this.mapContentEntryToResult<any>(e, locale!)),
            }
        }

        // Check if we have the entry in the default lang
        const masterEntry = await this.getMasterEntry(req, type, id);
        if (masterEntry) {
            return {
                versions: [],
            };
        }

        logger.error(`Content not found: ${type}:${id}`);
        const error: MashroomContentApiError = 'Not Found';
        throw new Error(error);
    }

    async insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');
        const defaultLocale = this.getDefaultLocale(req);
        const {locale = defaultLocale, status = 'published'} = content.meta || {};

        const masterEntriesCollection = await this.getContentMasterEntriesCollection(req);
        const entriesCollection = await this.getContentEntriesCollection(req, locale);

        // Create new contentId
        const contentId = nanoid(8);

        // Insert master entry
        const masterEntry = await masterEntriesCollection.insertOne({
            _contentId: contentId,
            _contentCreated: Date.now(),
            _contentUpdated: Date.now(),
            _contentType: type,
            _contentLanguages: [locale],
        });
        logger.debug('Inserted new master content entry:', masterEntry);

        // Insert entry
        const entry = await entriesCollection.insertOne({
            _contentId: contentId,
            _contentCreated: Date.now(),
            _contentUpdated: Date.now(),
            _contentType: type,
            _contentVersion: 1,
            _contentStatus: status,
            _contentAvailableLanguages: [locale],
            ...content.data,
        });
        logger.debug('Inserted new content entry:', entry);

        return this.mapContentEntryToResult<any>(entry, locale);
    }

    async updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');

        const masterEntry = await this.getMasterEntry(req, type, id);
        if (!masterEntry) {
            logger.error(`Content not found: ${type}:${id}`);
            const error: MashroomContentApiError = 'Not Found';
            throw new Error(error);
        }

        const defaultLocale = this.getDefaultLocale(req);
        const {locale = defaultLocale, status = 'published'} = content.meta || {};

        const masterEntriesCollection = await this.getContentMasterEntriesCollection(req);
        const entriesCollection = await this.getContentEntriesCollection(req, locale);

        const availableLanguages = [...masterEntry._contentLanguages];
        const newLocale = !masterEntry._contentLanguages.includes(locale);

        // This is a new language: update master and availableLanguages
        if (newLocale) {
            availableLanguages.push(locale);
            const updatedMasterEntry = await masterEntriesCollection.updateOne({
                _contentId: id,
                _contentType: type,
            }, {
                _contentUpdated: Date.now(),
                _contentLanguages: availableLanguages,
            });
            logger.debug('Update master content entry:', updatedMasterEntry);

            for (const l of masterEntry._contentLanguages) {
                await (await this.getContentEntriesCollection(req, l)).updateMany({
                    _contentId: id,
                    _contentType: type,
                }, {
                    _contentUpdated: Date.now(),
                   _contentAvailableLanguages: availableLanguages,
                });
            }
        }

        // Get existing versions
        let nextVersion = 1;
        if (!newLocale) {
            const {versions} = await this.getContentVersions(req, type, id, locale);
            const highestVersion = versions.map((v) => parseInt(v.meta.version!)).sort().pop() || 0;
            nextVersion = highestVersion + 1;
        }

        if (status === 'draft') {
            // Set status historic for existing draft entries
            await entriesCollection.updateMany({
                _contentId: id,
                _contentType: type,
                _contentStatus: 'draft',
            }, {
                _contentUpdated: Date.now(),
                _contentStatus: 'historic',
            });
        } else {
            // Set status historic for all existing entries
            await entriesCollection.updateMany({
                _contentId: id,
                _contentType: type,
            }, {
                _contentUpdated: Date.now(),
                _contentStatus: 'historic',
            });
        }

        // Insert updated entry
        const entry = await entriesCollection.insertOne({
            _contentId: id,
            _contentCreated: Date.now(),
            _contentUpdated: Date.now(),
            _contentType: type,
            _contentVersion: nextVersion,
            _contentStatus: status,
            _contentAvailableLanguages: availableLanguages,
            ...content.data,
        });
        logger.debug('Updated content entry:', entry);

        return this.mapContentEntryToResult<any>(entry, locale);
    }

    async removeContent(req: Request, type: string, id: string): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');

        const masterEntry = await this.getMasterEntry(req, type, id);
        if (!masterEntry) {
            logger.error(`Content not found: ${type}:${id}`);
            const error: MashroomContentApiError = 'Not Found';
            throw new Error(error);
        }

        // Remove master entry
        const masterEntriesCollection = await this.getContentMasterEntriesCollection(req);
        await masterEntriesCollection.deleteOne({
           _contentType: type,
           _contentId: id,
        });
        logger.debug(`Deleted master entry for ${type}:${id}`);

        // Remove all entries of all languages
        for (const locale of masterEntry._contentLanguages) {
            const entriesCollection = await this.getContentEntriesCollection(req, locale);
            await entriesCollection.deleteMany({
                _contentType: type,
                _contentId: id,
            });
            logger.debug(`Deleted locale ${locale} of entry ${type}:${id}`);
        }
    }

    async removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');
        if (!locales?.length && !versions?.length) {
            return;
        }

        const masterEntry = await this.getMasterEntry(req, type, id);
        if (!masterEntry) {
            logger.error(`Content not found: ${type}:${id}`);
            const error: MashroomContentApiError = 'Not Found';
            throw new Error(error);
        }

        // Remove given locales
        if (!versions?.length) {
            for (const lang of locales!) {
                const entriesCollection = await this.getContentEntriesCollection(req, lang);
                await entriesCollection.deleteMany({
                    _contentType: type,
                    _contentId: id,
                });
                logger.debug(`Deleted locale ${lang} of entry ${type}:${id}`);
            }

            // Update available content languages
            const updatedContentLanguages = masterEntry._contentLanguages.filter((lang) => locales?.indexOf(lang) === -1);
            const masterCollection = await this.getContentMasterEntriesCollection(req);
            await masterCollection.updateOne({
                _contentType: type,
                _contentId: id,
            }, {
                _contentUpdated: Date.now(),
                _contentLanguages: updatedContentLanguages,
            });
            for (const lang of updatedContentLanguages) {
                const entriesCollection = await this.getContentEntriesCollection(req, lang);
                await entriesCollection.updateMany({
                    _contentType: type,
                    _contentId: id,
                }, {
                    _contentUpdated: Date.now(),
                    _contentAvailableLanguages: updatedContentLanguages,
                });
            }

        } else {
            const updateLocales = locales?.length ? locales : masterEntry._contentLanguages;
            for (const locale of updateLocales) {
                const entriesCollection = await this.getContentEntriesCollection(req, locale);
                await entriesCollection.deleteMany({
                    _contentType: type,
                    _contentId: id,
                    _contentVersion: { $in: versions },
                });
                logger.debug(`Deleted versions: [${versions.join(',')}] of locale ${locale} of entry ${type}:${id}`);
            }
        }
    }

    async uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset> {
        const logger = req.pluginContext.loggerFactory('mashroom.content.provider.internal-storage');

        let subfolder = path ?? '';
        if (subfolder.startsWith('/')) {
            subfolder = subfolder.substring(1);
        }
        const targetFolder = resolve(this.#assetsFolder, subfolder);
        ensureDirSync(targetFolder);

        const {fileName} = meta;
        const targetFileName = `${nanoid(8)}_${fileName}`;
        const targetPath = resolve(targetFolder, targetFileName);
        const url = `${DOWNLOADS_URL_PREFIX}/${subfolder ? `${subfolder}/` : ''}${encodeURIComponent(targetFileName)}`;

        const target = createWriteStream(targetPath);
        file.pipe(target);
        await new Promise((resolve) => target.on('finish', resolve));

        const id = nanoid(8);

        const asset: MashroomContentAsset = {
            id,
            url,
            meta,
        }
        const assetEntry: AssetEntry = {
            _assetId: id,
            _assetCreated: Date.now(),
            ...asset,
        }
        const assetCollection = await this.getAssetsCollection(req);
        await assetCollection.insertOne(assetEntry);

        if (contentRef) {
            const defaultLocale = this.getDefaultLocale(req);
            const {type, id, fieldName, locale = defaultLocale} = contentRef;
            const entry = await this.getContent(req, type, id, locale);
            if (entry) {
                await this.updateContent(req, type, id, {
                    data: {
                      ...entry.data as any,
                      [fieldName]: url,
                    },
                    meta: {
                        locale,
                    },
                });
            } else {
                logger.error(`Invalid content ref: Could not find entry ${type}:${id} with locale ${locale}`);
            }
        }

        return asset;
    }

    async searchAssets(req: Request, type?: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult> {
        const assetCollection = await this.getAssetsCollection(req);

        let filter: MashroomStorageObjectFilter<AssetEntry> | undefined;
        if (type || titleContains) {
            filter = {
                $and: []
            }
            if (type) {
                filter.$and!.push({
                    'meta.mimeType': { $regex: type, $options: 'i' },
                })
            }
            if (titleContains) {
                filter.$and!.push({
                    'meta.title': { $regex: titleContains, $options: 'i' },
                })
            }
        }

        // Sort by timestamp desc
        const sort: MashroomStorageSort<AssetEntry> = {
            _assetCreated: 'desc',
        };

        const {result, totalCount} = await assetCollection.find(filter, limit, skip, sort);
        const hits: Array<MashroomContentAsset> = result.map((e) => this.mapAssetEntryToResult(e));

        return {
            hits,
            meta: {
                total: totalCount,
            },
        };
    }

    async removeAsset(req: Request, id: string): Promise<void> {
        const assetCollection = await this.getAssetsCollection(req);

        const asset = await assetCollection.findOne({ _assetId: id });
        if (!asset) {
            const error: MashroomContentApiError = 'Not Found';
            throw new Error(error);
        }

        const targetFileName = decodeURIComponent(asset.url.substring(DOWNLOADS_URL_PREFIX.length + 1));
        const targetPath = resolve(this.#assetsFolder, targetFileName);

        try {
            unlinkSync(targetPath);
        } catch (error) {
            console.error(`Unable to remove asset from file system: ${targetPath}`);
        }

        await assetCollection.deleteOne({ _assetId: id });
    }

    getAssetProxies(): MashroomContentApiAssetProxyConfigs {
        return {
            p1: {
                urlPrefix: DOWNLOADS_URL_PREFIX,
                allowImageProcessing: true,
                toFullUri: (path) => {
                    const cleanPath = path.split('?')[0];
                    return `file://${this.#assetsFolder}${cleanPath.substring(DOWNLOADS_URL_PREFIX.length)}`
                },
            }
        };
    }

    private mapContentEntryToResult<T>(entry: MashroomStorageObject<ContentEntry<T>>, locale: string): MashroomContentApiContentWrapper<T> {
        return {
            id: entry._contentId,
            data: this.cleanEntry(entry),
            meta: {
                locale,
                availableLocales: entry._contentAvailableLanguages,
                status: entry._contentStatus === 'published' || entry._contentStatus === 'draft' ? entry._contentStatus : undefined,
                version: String(entry._contentVersion),
            }
        }
    }

    private mapAssetEntryToResult(entry: MashroomStorageObject<AssetEntry>): MashroomContentAsset {
        return {
            id: entry._assetId,
            url: entry.url,
            meta: entry.meta,
        };
    }

    private cleanEntry(entry: any): any {
        const result: any = {};
        Object.keys(entry).forEach((key) => {
           if (!key.startsWith('_content') && key !== '_id') {
               result[key] = entry[key];
           }
        });
        return result;
    }

    private async getMasterEntry(req: Request, type: string, id: string): Promise<ContentMasterEntry | null | undefined> {
        const masterEntriesCollection = await this.getContentMasterEntriesCollection(req);
        const masterEntryFilter: MashroomStorageObjectFilter<ContentMasterEntry> = {
            $and: [
                { _contentType: type },
                { _contentId: id },
            ]
        };
        return masterEntriesCollection.findOne(masterEntryFilter);
    }

    private async getContentMasterEntriesCollection(req: Request): Promise<MashroomStorageCollection<ContentMasterEntry>> {
        return this.getStorageService(req).getCollection(CONTENT_MASTER_ENTRY_COLLECTION_NAME);
    }

    private async getContentEntriesCollection<T>(req: Request, locale: string): Promise<MashroomStorageCollection<ContentEntry<T>>> {
        return this.getStorageService(req).getCollection(`${CONTENT_ENTRY_COLLECTION_PREFIX}${locale}`);
    }

    private async getAssetsCollection<T>(req: Request): Promise<MashroomStorageCollection<AssetEntry>> {
        return this.getStorageService(req).getCollection(`${ASSET_COLLECTION_NAME}`);
    }

    private getStorageService(req: Request): MashroomStorageService {
        return req.pluginContext.services.storage.service;
    }

    private getDefaultLocale(req: Request): string {
        const i18nService: MashroomI18NService = req.pluginContext.services.i18n?.service;
        if (i18nService) {
            return i18nService.defaultLanguage;
        }
        return 'en';
    }

    private mapToStorageFilter<T extends MashroomStorageRecord>(filter: MashroomContentApiFilter<T>): MashroomStorageObjectFilter<T> {
        const rewriteOperator = (op: string, target: any, parent: any): void => {
            switch (op) {
                case '$contains': {
                    parent['$regex'] = target;
                    break;
                }
                case '$containsi': {
                    parent['$regex'] = target;
                    parent['$options'] = 'i';
                    break;
                }
                case '$notContains': {
                    parent['$not'] = {
                        $regex: target,
                    };
                    break;
                }
                case '$notContainsi': {
                    parent['$not'] = {
                        $regex: target,
                        $options: 'i',
                    };
                    break;
                }
                default:
                    parent[op] = target;
            }
        }
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
        }
        return map(filter);
    }
}
