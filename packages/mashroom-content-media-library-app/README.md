
# Mashroom Content Media Library App

Plugin for [Mashroom Server](https://www.mashroom-server.com), a **Microfrontend Integration Platform**.
Part of the [Mashroom Content](https://github.com/nonblocking/mashroom) extension.

This Portal App allows it to manage a Media Library (Images, Videos).

## Usage

If *node_modules/@mashroom* is configured as plugin path just add **@mashroom-content/mashroom-content-media-library-app** as *dependency*.

After that you can Drag the App _Mashroom Content Media Library App_ onto any page via Admin Toolbar.

And you can also use it in your custom Portal Apps to lookup assets like this:

```typescript
const responseChannelTopic = `__selected_image_${randomId()}__`;
const mediaLibraryAppConfig = {
    modalMode: true,
    typeFilter: 'image',
    responseChannelTopic,
};
portalAppService.loadAppModal('Mashroom Content Media Library App', 'Select Image', mediaLibraryAppConfig).then((portalApp) => {
    messageBus.subscribeOnce(responseChannelTopic, (asset: MashroomContentAsset) => {
        console.debug('Received asset:', asset);
        // TODO: process received asset
        portalAppService.unloadApp(portalApp.id);
    });
});
```
