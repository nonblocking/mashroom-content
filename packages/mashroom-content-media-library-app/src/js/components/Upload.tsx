import React from 'react';
import {useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {cancelUploadFile} from '../store/actions';

import type {Upload, Dispatch} from '../types';

type Props = {
    upload: Upload;
}

export default ({upload: {id, error, progress}}: Props) => {
    const dispatch = useDispatch() as Dispatch;

    return (
        <div className="mashroom-content-media-library-asset-upload">
            {!error && (
                <div className="progress-container">
                    <div className="progress-bar">
                        <div className="progress" style={{width: `${progress}%`}} />
                    </div>
                    <div className="upload-cancel">
                        <a href="javascript:void(0)" onClick={() => { dispatch(cancelUploadFile(id))} }>
                            <FormattedMessage id='cancel' />
                        </a>
                    </div>
                </div>
            )}
            {error && (
               <div className='upload-error'>
                   <div className="mashroom-portal-app-loading-error" >
                       <FormattedMessage id='uploadFailed' />
                   </div>
               </div>
            )}
        </div>
    )
}
