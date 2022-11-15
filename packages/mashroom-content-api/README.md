
# Mashroom Content API

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This plugin adds an API abstraction that allows you to retrieve and manage content from a Headless CMS.
It allows it to transparently switch the Headless CMS/Content Provider.

## Features

 * Allows you to retrieve and manage content from a Headless CMS
 * The content services can be used on the server side and on the client side in *Microfrontends* (Portal Apps)
 * Allows it to transparently switch the Headless CMS/Content Provider
 * Automatic image proxying with optimizations (format conversion and resizing on-the-fly)
 * CDN integration

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-api** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Content Services": {
            "provider": "Mashroom Content Internal Storage Provider",
            "cacheEnable": true,
            "cacheTTLSec": 1800
        },
        "Mashroom Content Provider API": {
            "path": "/content",
            "uploadTmpDir": null
        }
    }
}
```

 * _provider_: The Headless CMS provider plugin (Default: _Mashroom Content Internal Storage Provider_)
 * _cacheEnable_: Enable server side and browser caching of content (server side requires @mashroom/mashroom-memory-cache) (Default: true)
 * _cacheTTLSec_: Cache TTL in seconds (Default: 1800)
 * _path_: The base path for the content API (Default: /content)
 * _uploadTmpDir_: A specific upload folder (absolute or relative to the server config file)

### Security

**IMPORTANT NOTE**: The Content API (and therefore the client service) has no security at all at the moment.
So, to make sure that normal users cannot update and delete content you should add an ACL configuration like this:

```json
{
    "/content/**": {
        "*": {
            "allow": {
                "roles": ["Administrator"]
            }
        },
        "GET": {
            "allow": "any"
        }
    }
}
```

### Service

On the Server side you can use the following new service accessible through _pluginContext.services.content.service_:

```ts
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
     * Upload an asset (image or video).
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
```

### Client Service

On the client side you can use _MashroomContentClientService_ like this:

```ts
const bootstrap: MashroomPortalAppPluginBootstrapFunction = async (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig, user} = portalAppSetup;
    const contentService: MashroomContentClientService = clientServices.contentService;

    const result = await contentService.getContent('my-content', 'sdfjkld');

    // ...
}
```

The interface:

```ts
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
```

### REST API

And you can directly use the REST API which is specified in [spec/mashroom-content-api.yaml](https://github.com/nonblocking/mashroom-content/tree/master/packages/mashroom-content-api/spec/mashroom-content-api.yaml)

### Custom Provider Plugin

To register a custom memory-cache-provider plugin add this to _package.json_:

```json
{
    "mashroom": {
        "plugins": [
            {
                "name": "My Content Provider",
                "type": "content-provider",
                "bootstrap": "./dist/mashroom-bootstrap.js",
                "defaultConfig": {
                    "myProperty": "test"
                }
            }
        ]
    }
}
```

The bootstrap returns the provider:

```ts
import MashroomContentProviderInternalStorageImpl from './MashroomContentProviderInternalStorageImpl';
import type {MashroomContentProviderPluginBootstrapFunction} from '@mashroom-content/mashroom-content-api/type-definitions';

const bootstrap: MashroomContentProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MyContentProvider();
};

export default bootstrap;
```
And the provider has to implement the following interface:

```ts
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
     * Upload an asset (image or video).
     * The given path can be ignored if not supported.
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
```
