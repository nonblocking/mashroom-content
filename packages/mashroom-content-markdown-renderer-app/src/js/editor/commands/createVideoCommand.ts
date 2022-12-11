import randomId from './randomId';
import insertAtSelection from './insertAtSelection';
import type {MashroomPortalAppService, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions/api';
import type {MashroomContentAsset} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {EditorCommand} from '../../types';

export default (title: string, portalAppService: MashroomPortalAppService, messageBus: MashroomPortalMessageBus): EditorCommand => {
   return (cm) => {
       const responseChannelTopic = `__selected_video_${randomId()}__`;
       const mediaLibraryAppConfig = {
           modalMode: true,
           typeFilter: 'video',
           responseChannelTopic,
       };
       portalAppService.loadAppModal('Mashroom Content Media Library App', title, mediaLibraryAppConfig).then((portalApp) => {
           messageBus.subscribeOnce(responseChannelTopic, (asset: MashroomContentAsset) => {
               console.debug('Received asset:', asset);
               const {url, meta: {mimeType}} = asset;
               if (mimeType.indexOf('video/') === 0) {
                   insertAtSelection(cm, `::video{src=${url}}`);
               } else {
                   console.error('Selected asset is no video:', asset);
               }
               portalAppService.unloadApp(portalApp.id);
           });
       });
   };
}
