
# Mashroom Content Internal Storage Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This plugin adds a content provider which uses the internal Mashroom storage (e.g. Mongo).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-provider-internal-storage** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Content Internal Storage Provider": {
           "assetsFolder": "./data/assets"
        }
    }
}
```

* _assetsFolder_: The folder where uploads should be stored (absolute or relative to the server config file)
  ***NOTE***: This needs to be a shared folder among all Mashroom instances.
