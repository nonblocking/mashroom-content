
# Mashroom Content Strapi Provider

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This plugin adds a content provider which uses the [Strapi Headless CMS](https://strapi.io/) as backend.

Only tested with Strapi 4.x. Supports internationalization but no versioning and also not the draft mechanism.

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-provider-strapi** as *dependency*.

You can override the default config in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Content Strapi Provider": {
            "strapiUrl": "http://localhost:1337",
            "apiToken": "xxxxxxx"
        }
    }
}
```

* _strapiUrl_: Strapi server base URL
* _apiToken_: Strapi API token

### Preparing the Strapi instance

Your Strapi instance needs at least an activated Internationalization Plugin with the same languages as configured in _Mashroom_

Also, if you want to use the _Mashroom Content Markdown Renderer App_ you need to create a content type _markdown_ with two properties: _title_ (string), _content_ (rich text).
