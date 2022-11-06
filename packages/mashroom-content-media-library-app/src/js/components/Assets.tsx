import React, {useCallback} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {MAX_HITS} from '../constants';
import {setSearchSkip, uploadFile} from '../store/actions';
import MainActions from './MainActions';
import SearchBar from './SearchBar';
import AssetGrid from './AssetGrid';
import DropTarget from './DropTarget';

import type {MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {State, Dispatch} from '../types';

type Props = {
    messageBus: MashroomPortalMessageBus;
    contentService: MashroomContentClientService;
}

export default ({messageBus, contentService}: Props) => {
    const {result, running, error, skip} = useSelector((state: State) => state.search);
    const dispatch = useDispatch() as Dispatch;
    const showMore = useCallback(() => {
        dispatch(setSearchSkip((skip || 0) + MAX_HITS));
    }, [skip]);
    const upload = useCallback((files: Array<File>) => {
        for (let i = 0; i < files.length; i++) {
            dispatch(uploadFile(contentService, files[i]));
        }
    }, []);

    return (
        <div className="mashroom-content-media-library-assets">
            <DropTarget onDrop={(files) => { upload(files); }}>
                <MainActions contentService={contentService} />
                <SearchBar contentService={contentService} />
                {error && (
                    <div className="mashroom-portal-app-loading-error" >
                        <FormattedMessage id='searchFailed' />
                    </div>
                )}
                {!error && result && (
                    <div className="asset-hits">
                        <AssetGrid messageBus={messageBus} contentService={contentService} />
                        {(result.meta.total > (skip || 0) + MAX_HITS) && !running && (
                            <div className="show-more">
                                <a href="javascript:void(0)" onClick={showMore}>
                                    <FormattedMessage id="showMore" />
                                </a>
                            </div>
                        )}
                    </div>
                )}
                {!error && running && (
                    <div className="mashroom-portal-app-loading" >
                        <span />
                    </div>
                )}
            </DropTarget>
        </div>
    )
}
