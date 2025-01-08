import React, {useCallback} from 'react';
import {useSelector} from 'react-redux';
import {filesize} from 'filesize';
import AssetActions from './AssetActions';
import Image from './Image';
import Video from './Video';
import GenericDocument from './GenericDocument';
import Upload from './Upload';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentAsset, MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {State} from '../types';

const getPreviewComponent = ({url, meta}: MashroomContentAsset) => {
    if (meta.mimeType?.indexOf('image/') === 0) {
        return <Image url={url} />;
    } else if (meta.mimeType?.indexOf('video/') === 0) {
        return <Video url={url} />;
    }
    return <GenericDocument mimeType={meta.mimeType} />;
};

type Props = {
    messageBus: MashroomPortalMessageBus;
    contentService: MashroomContentClientService;
}

export default ({messageBus, contentService}: Props) => {
    const uploads = useSelector((state: State) => state.uploads);
    const {modalMode, responseChannelTopic} = useSelector((state: State) => state.config);
    const {result: {hits} = {}} = useSelector((state: State) => state.search);
    if (!hits) {
        return null;
    }

    const openOrSelect = useCallback((asset: MashroomContentAsset) => {
        if (modalMode) {
            messageBus.publish(responseChannelTopic, asset);
        } else {
            global.open(asset.url, '_blank');
        }
    }, []);

    return (
        <div className="mashroom-content-media-library-asset-grid">
            {
                uploads.map((upload) => (
                    <div key={upload.id} className="asset-grid-item">
                        <div className="asset-grid-item-thumb">
                            <Upload upload={upload} />
                        </div>
                        <div className="asset-grid-item-info">
                            <div className="title">
                                {upload.file.name}
                            </div>
                            <div className="details">
                               <span>
                                   {filesize(upload.file.size) as string}
                               </span>
                            </div>
                        </div>
                    </div>
                ))
            }
            {
                hits.map((asset) => (
                    <div key={asset.url} className="asset-grid-item" onClick={() => openOrSelect(asset)}>
                        <AssetActions asset={asset} contentService={contentService} />
                        <div className="asset-grid-item-thumb">
                            {getPreviewComponent(asset)}
                        </div>
                        <div className="asset-grid-item-info">
                            <div className="title">
                                {asset.meta.title}
                            </div>
                            <div className="details">
                                {asset.meta.size && (
                                    <span>
                                        {filesize(asset.meta.size) as string}
                                        {asset.meta.width && asset.meta.height && ', '}
                                    </span>
                                )}
                                {asset.meta.width && asset.meta.height && (
                                    <span>{asset.meta.width}x{asset.meta.height}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))
            }
        </div>
    );
};
