
# Mashroom Content Markdown Renderer App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This Portal App renders Markdown content from a Headless CMS
and also provides the possibility to update/create content directly as Administrator.

### Features

 * Images are automatically optimized for the target devices (and converted to webp/avif if possible)
 * Server-side rendering for SEO
 * Simple integration of Videos from the local media library, Youtube or Vimeo
 * Extra CSS per instance which will only be applied to the content

#### Markdown extensions

 * Supports [Github Flavored Markdown](https://github.github.com/gfm/) (e.g. tables)
 * Supports [Markdown Directives](https://talk.commonmark.org/t/generic-directives-plugins-syntax/444):

```markdown
:::div{class=my-class}

her my text

:::
```

Or:

```markdown
::a[My Link]{href=/goto target=_blank}
```

 * A bunch of custom extensions such as:

```markdown
::vimeo{id=612710291 privateKey=dba51808e0}
::youtube{id=z9eoubnO-pE}
::video{src=/url-to-my-video}
::button{href=/url-to-navigate-to target=_blank}
```

 * And the built-in possibility to jump to specific elements like this:

```markdown
::h2[My header]{id=myHeader}

Jump to it with:

::a[Jump]{gotoId=myHeader}

or

::button[Jump]{gotoId=myHeader}
```

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-markdown-renderer-app** as *dependency*.

After that you can Drag the App _Mashroom Display_ onto any page via Admin Toolbar.

**Important note**: This App assumes a content type _markdown_ exists and has the following structure:

```json
{
    "title": "My content",
    "content": "Here some **markdown** content"
}
```

If you need to change that globally you can override it in your Mashroom config file like this:

```json
{
    "plugins": {
        "Mashroom Content Markdown Renderer App": {
            "appConfig": {
                "contentType": "markdown",
                "contentProp": "content",
                "titleProp": "title"
            }
        }
    }
}
```

* _contentType_: The content type (Default: markdown)
* _contentProp_: The property that contains the actual content (Default: content)
* _titleProp_: The property that contains the title (Default: title)
