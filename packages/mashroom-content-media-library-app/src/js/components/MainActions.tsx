import React, {useCallback} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {uploadFile} from '../store/actions';

import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {State, Dispatch} from '../types';

type Props = {
    contentService: MashroomContentClientService;
}

export default ({contentService}: Props) => {
    const {typeFilter} = useSelector((state: State) => state.search);
    const dispatch = useDispatch() as Dispatch;
    const upload = useCallback((files: FileList | null) => {
        if (files) {
            for (let i = 0; i < files.length; i++) {
                dispatch(uploadFile(contentService, files[i]));
            }
        }
    }, []);

    let accept = undefined;
    if (typeFilter) {
        accept = `${typeFilter}/*`;
    }

    return (
        <div className="mashroom-content-media-library-main-actions">
            <div className="upload">
                <div className="upload-button-wrapper">
                    <label>
                        <span className="icon-upload" />
                        <FormattedMessage id='upload' />
                    </label>
                    <input
                        type="file"
                        multiple
                        accept={accept}
                        onChange={(e) => { upload(e.target.files ); }} />
                </div>
            </div>
        </div>
    );
};
