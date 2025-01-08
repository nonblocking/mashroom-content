import randomId from './randomId';
import insertAtSelection from './insertAtSelection';
import type {MashroomPortalAppService, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions/api';
import type {MashroomContentAsset} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {EditorCommand} from '../../types';

export default (title: string, portalAppService: MashroomPortalAppService, messageBus: MashroomPortalMessageBus): EditorCommand => {
    return (cm) => {
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
                    insertAtSelection(cm, `![${title}](${url}${dimensionsHint})`, 2, title.length + 2);
                } else {
                    console.error('Selected asset is no image:', asset);
                }
                portalAppService.unloadApp(portalApp.id);
            });
        });
    };
};
