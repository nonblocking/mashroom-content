import React from 'react';
import {useSelector} from 'react-redux';
import {FormattedMessage} from 'react-intl';

import type {EditorState} from '../../types';

export default () => {
    const {savingError} = useSelector((state: EditorState) => state.content);

    return (
        <div className="global-messages">
            {savingError && (
                <div className="mashroom-portal-app-loading-error" >
                    <FormattedMessage id='savingFailed' />
                </div>
            )}
        </div>
    );
};
