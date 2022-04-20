import randomId from './randomId';
import type {Command} from 'react-mde';
import type {MashroomPortalAppService, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions/api';
import type {MashroomContentAsset} from '@mashroom-content/mashroom-content-api/type-definitions';

export default (title: string, portalAppService: MashroomPortalAppService, messageBus: MashroomPortalMessageBus): Command => {
    return {
        execute: (opts) => {
            const responseChannelTopic = `__selected_image_${randomId()}__`;
            const mediaLibraryAppConfig = {
                modalMode: true,
                typeFilter: 'image',
                responseChannelTopic,
            };
            portalAppService.loadAppModal('Mashroom Content Media Library App', title, mediaLibraryAppConfig).then((portalApp) => {
                messageBus.subscribeOnce(responseChannelTopic, (asset: MashroomContentAsset) => {
                    console.debug('Received asset:', asset);
                    const {url, meta: {title, mimeType, height, width}} = asset;
                    if (mimeType.indexOf('image/') === 0) {
                        let dimensionsHint = '';
                        if (width && height) {
                            dimensionsHint = `#${width}x${height}`;
                        }
                        opts.textApi.replaceSelection(`![${title}](${url}${dimensionsHint})`);
                    } else {
                        console.error('Selected asset is no image:', asset);
                    }
                    portalAppService.unloadApp(portalApp.id);
                });
            });
        }
    };
}
