
# Change Log

## [unreleased]

 * Content Provider Strapi: Added support for Strapi 5
 * Added properties *createdAt* and *updatedAt* to content entry metadata

## 1.0.2 (December 28, 2022)

 * Media Library App: Fixed icons

## 1.0.1 (December 28, 2022)

 * Markdown Renderer App: Fixed the icons in the editor toolbar

## 1.0.0 (December 28, 2022)

 * Markdown Renderer App: Replaced react-mde by CodeMirror for Markdown editing
 * Content Provider Internal Storage: Added support for storing assets in subfolders (via path argument)
 * Markdown Renderer App: Fixed re-rendering after saving in the editor

## 1.0.0-alpha.5 (November 7, 2022)

 * Markdown Renderer App: Fixed server-side rendering
 * Asset Processor: Fixed image conversion and a streaming problem that lead to stuck image downloads under some circumstancs
 * Content Provider Strapi: Fixed writing captions for uploads
 * Upgraded 3rd party libraries

## 1.0.0-alpha.4 (April 27, 2022)

 * Asset Processor: Convert images in the background and deliver the original image until it is done
   (otherwise you would have to wait until the webp/avif is generated which can take quite some time)
 * Markdown Renderer App: Load original image only if requested

## 1.0.0-alpha.3 (April 25, 2022)

 * Asset Processor: Return original image if processing fails

## 1.0.0-alpha.1 (April 20, 2022)

Initial github import.
