import React, {useCallback, useContext} from 'react';
import {useDispatch} from 'react-redux';
import {IntlContext} from 'react-intl';
import {removeAsset} from '../store/actions';

import type {SyntheticEvent} from 'react';
import type {MashroomContentClientService, MashroomContentAsset} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {Dispatch} from '../types';

type Props = {
    asset: MashroomContentAsset;
    contentService: MashroomContentClientService;
}

export default ({asset, contentService}: Props) => {
    const dispatch = useDispatch() as Dispatch;
    const remove = useCallback((e: SyntheticEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dispatch(removeAsset(contentService, asset.id));
    }, [asset]);
    const {formatMessage} = useContext(IntlContext);

    return (
        <div className='mashroom-content-media-library-asset-actions' title={formatMessage({id: 'delete'})}>
            <div className='asset-action-remove' onClick={remove}/>
        </div>
    );
};
