
# Mashroom Content Assets

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This plugin adds a service to fetch and process assets (e.g. image conversion).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-asset-processing** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Content Asset Processing Services": {
            "scaleUp": false,
            "defaultQuality": 75,
            "cacheEnable": true,
            "cacheDefaultTTLSec": 31536000,
            "cacheFolder": "./data/asset-proc-cache"
        }
    }
}
```

* _scaleUp_: Scale images up (Default: false)
* _defaultQuality_: Default image conversion quality (Default: 75)
* _cacheEnable_: Enable asset cache (Default: true)
* _cacheDefaultTTLSec_: Asset cache TTL in seconds (Default: 31536000)
* _cacheFolder_: Cache folder (Default: ./data/asset-proc-cache)

### Service

On the Server side you can use the following new service accessible through _pluginContext.services.assetProc.service_:

```ts
export interface MashroomContentAssetProcService {
    /**
     * Process and return given asset from URI - result will be cached
     */
    processAssetFromUri(assetUri: string, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<MashroomContentAssetProc>;

    /**
     * Process given asset
     */
    processAsset(asset: Readable, resize?: MashroomContentAssetProcImageResize, convert?: MashroomContentAssetProcImageConvert): Promise<Readable>;
}
```
