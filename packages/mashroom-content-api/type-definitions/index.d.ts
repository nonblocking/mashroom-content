
import type {Readable} from 'stream';
import type {Request} from 'express';
import type {MashroomPluginConfig, MashroomPluginContextHolder} from '@mashroom/mashroom/type-definitions';
import type {
    MashroomContentAssetProcImageFormats,
} from '@mashroom-content/mashroom-content-asset-processing/type-definitions';

export type MashroomContentApiError = 'Access Denied' | 'Not Found' | 'Not implemented' | 'Invalid Filter' | 'Provider Internal Error';

export type MashroomContentApiStatus = 'published' | 'draft';

export type MashroomContentApiContentUpdateInsert<T> = {
    readonly data: T;
    readonly meta?: {
        readonly locale?: string | undefined;
        readonly status?: MashroomContentApiStatus | undefined;
    };
}

export type MashroomContentApiContentMeta = {
    readonly locale?: string;
    readonly availableLocales?: Array<string>;
    readonly version?: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly status: MashroomContentApiStatus;
}

export type MashroomContentApiContentWrapper<T> = {
    readonly id: string;
    readonly data: T;
    readonly meta: MashroomContentApiContentMeta;
}

export type MashroomContentApiSearchResultMeta = {
    readonly total: number;
}

export type MashroomContentApiContentSearchResult<T> = {
    readonly hits: Array<MashroomContentApiContentWrapper<T>>;
    readonly meta: MashroomContentApiSearchResultMeta;
}

export type MashroomContentVersionsResult<T> = {
    readonly versions: Array<MashroomContentApiContentWrapper<T>>;
}

type AlternativeType<T> = T extends ReadonlyArray<infer U> ? T | U : T;

type Condition<T> = AlternativeType<T> | FilterOperators<AlternativeType<T>>;

type FilterOperators<T> = {
    readonly $eq?: T;
    readonly $ne?: T;
    readonly $gt?: T;
    readonly $gte?: T;
    readonly $lt?: T;
    readonly $lte?: T;
    readonly $in?: ReadonlyArray<T>;
    readonly $nin?: ReadonlyArray<T>;
    readonly $exists?: boolean;
    readonly $contains?: string;
    readonly $containsi?: string;
    readonly $notContains?: string;
    readonly $notContainsi?: string;
}

type RootFilterOperators<T> = {
    readonly $and?: Array<MashroomContentApiFilter<T>>;
    readonly $or?: Array<MashroomContentApiFilter<T>>;
}

export type MashroomContentApiFilter<T> = {
    readonly [P in keyof T]?: Condition<T[P]>;
} & RootFilterOperators<T>;

export type MashroomContentApiSort<T> = {
    readonly [P in keyof Partial<T>]: 'asc' | 'desc';
}

export type MashroomContentAsset = {
    readonly id: string;
    readonly url: string;
    readonly meta: MashroomContentAssetMeta;
}

export type MashroomContentAssetMeta = {
    readonly title: string;
    readonly fileName: string;
    readonly mimeType: string;
    readonly width?: number;
    readonly height?: number;
    readonly size?: number;
}

export type MashroomContentAssetSearchResult = {
    readonly hits: Array<MashroomContentAsset>;
    readonly meta: MashroomContentApiSearchResultMeta;
}

export type MashroomContentAssetContentRef = {
    readonly type: string;
    readonly id: string;
    readonly fieldName: string;
    readonly locale: string | undefined;
}

export type MashroomContentApiAssetProxyConfig = {
    readonly urlPrefix: string;
    readonly allowImageProcessing?: boolean;
    toFullUri?: (path: string) => string;
}

export type MashroomContentApiAssetProxyConfigs = {
    readonly [name: string]: MashroomContentApiAssetProxyConfig;
}

export interface MashroomContentService {
    /**
     * Configured image breakpoints
     */
    imageBreakpoints: Array<number>;
    /**
     * Configured preferred image formats
     */
    imagePreferredFormats: Array<MashroomContentAssetProcImageFormats>;
    /**
     * Search for content of given type. You can use skip and limit for pagination.
     *
     * May throw 'Invalid Filter' (as error message).
     */
    searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus,
                     sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>>;
    /**
     * Get a specific content element identified by an ID.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    getContent<T>(req: Request, type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Get all available versions of given content.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    getContentVersions<T>(req: Request, type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>>;
    /**
     * Insert content for given type.
     * For most content providers the 'type' needs to be defined in the CMS backend first.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Partially update content with given type and ID.
     * This includes adding new localizations.
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Remove content with given type and ID.
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    removeContent(req: Request, type: string, id: string): Promise<void>;
    /**
     * Remove content parts (specific languages or versions).
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void>;
    /**
     * Upload an asset (image or video) to given path (if folders are supported by the provider).
     * If a contentRef is given the asset URL will be linked to given content.
     *
     * Will return download URL for the created asset.
     */
    uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset>;
    /**
     * Search for existing assets.
     *
     * type can be something like image/png or just image
     */
    searchAssets(req: Request, type?: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult>;
    /**
     * Remove given asset
     */
    removeAsset(req: Request, id: string): Promise<void>;
}

export interface MashroomContentUrlRewriteService {
    /**
     * Rewrite the URLs in the content that should be proxied
     * (based on the contentUrlProxies config of the active content provider plugin)
     */
    rewriteContent(req: Request, content: string, reverse?: boolean): string;
    /**
     * Rewrite the URL that should be proxied
     * (based on the contentUrlProxies config of the active content provider plugin)
     */
    rewriteUrl(req: Request, url: string, reverse?: boolean): string;
    /**
     * If the given URL is an asset proxy URL return the corresponding config
     */
    getProxyConfig(url: string): MashroomContentApiAssetProxyConfig | undefined;
}

export interface MashroomContentProvider {
    /**
     * Search for content of given type.
     */
    searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus,
                     sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>>;
    /**
     * Get a specific content element identified by an ID.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    getContent<T>(req: Request, type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Get all available versions of given content.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    getContentVersions<T>(req: Request, type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>>;
    /**
     * Insert content for given type.
     * For most content providers the 'type' needs to be defined in the CMS backend first.
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Partially update content with given type and ID.
     * This includes adding new localizations.
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Remove content with given type and ID.
     * If locales or versions are given only specific translations or versions are removed.
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    removeContent(req: Request, type: string, id: string): Promise<void>;
    /**
     * Remove content parts (specific languages or versions).
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void>;
    /**
     * Upload an asset (image or video) to given path (if folders are supported by the provider).
     * The path can be ignored if folders are not supported.
     * If a contentRef is given the asset URL should be linked to given content.
     *
     * Must return the download URL for the new asset. The URL will be translated if a corresponding URL proxy is set.
     */
    uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset>;
    /**
     * Search for existing assets.
     * The provider should return the assets sorted by upload timestamp (desc).
     *
     * type can be something like image/png or just image
     */
    searchAssets(req: Request, type?: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult>;
    /**
     * Remove given asset.
     *
     * May throw 'Access Denied' or 'Not Found' (as error message).
     */
    removeAsset(req: Request, id: string): Promise<void>;
    /**
     * Get a list of asset URIs that need to be proxied (and rewritten in the content)
     */
    getAssetProxies(): MashroomContentApiAssetProxyConfigs;
}

/**
 * Bootstrap method definition for storage plugins
 */
export type MashroomContentProviderPluginBootstrapFunction = (
    pluginName: string,
    pluginConfig: MashroomPluginConfig,
    contextHolder: MashroomPluginContextHolder,
) => Promise<MashroomContentProvider>;

export type PromiseWithProgressAndCancel<T> = {
    then(successCallback: (data: T) => void, errorCallback: (error: Error | any) => void, notifyCallback?: (data: { progress: number }) => void): void;
    cancel(): void;
};

/**
 * Client-side service
 */
export interface MashroomContentClientService {
    /**
     * Configured image breakpoints
     */
    imageBreakpoints: Array<number>;
    /**
     * Configured preferred image formats
     */
    imagePreferredFormats: Array<MashroomContentAssetProcImageFormats>;
    /**
     * Search for content of given type.
     */
    searchContent<T>(type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus,
                     sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>>;
    /**
     * Get a specific content element identified by an ID.
     */
    getContent<T>(type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Get all available versions of given content.
     */
    getContentVersions<T>(type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>>;
    /**
     * Insert content for given type.
     */
    insertContent<T>(type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Partially update content with given type and ID.
     * This includes adding new localizations.
     */
    updateContent<T>(type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>>;
    /**
     * Remove content with given type and ID.
     */
    removeContent(type: string, id: string): Promise<void>;
    /**
     * Remove content parts (specific languages or versions).
     */
    removeContentParts(type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void>;
    /**
     * Upload an asset (image or video).
     * If a contentRef is given the asset URL will be linked to given content.
     *
     * Will return download URL for the created asset.
    */
    uploadAsset(file: File, path?: string, contentRef?: MashroomContentAssetContentRef): PromiseWithProgressAndCancel<MashroomContentAsset>;
    /**
     * Search for existing assets.
     *
     * type can be something like image/png or just image
     */
    searchAssets(type?: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult>;
    /**
     * Remove given asset
     */
    removeAsset(id: string): Promise<void>;
}
