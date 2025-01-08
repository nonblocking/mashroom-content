import React, {useContext} from 'react';
import {FormattedMessage} from 'react-intl';
import {useDispatch, useSelector} from 'react-redux';
import {newContent, cloneContent, setEditorMode, saveContent} from '../store/actions';
import EditorContext from '../EditorContext';

import type {MashroomPortalConfigEditorTarget} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {EditorState, EditorDispatch} from '../../types';

type Props = {
    editorTarget: MashroomPortalConfigEditorTarget;
}

const saveAndClose = (style: string | undefined | null, belowFold: boolean, fullscreenImageOnClick: boolean,
                      dispatch: EditorDispatch, contentService: MashroomContentClientService, editorTarget: MashroomPortalConfigEditorTarget) => {
    dispatch(saveContent(contentService)).then(
        (contentId: string) => {
            editorTarget.updateAppConfig({
                ...editorTarget.appConfig,
                contentId,
                style,
                belowFold,
                fullscreenImageOnClick,
            });
            editorTarget.close();
        },
    ).catch((e: any) => {
       console.error('Save and close failed', e);
    });
};

export default ({editorTarget}: Props) => {
    const mode = useSelector((state: EditorState) => state.mode);
    const {contentId, style, belowFold, fullscreenImageOnClick, saving} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch() as EditorDispatch;
    const {contentService} = useContext(EditorContext);

    return (
        <div className="main-actions">
            {mode !== 'search' && (
                <button onClick={() => dispatch(setEditorMode('search'))}>
                    <FormattedMessage id='search' />
                </button>
            )}
            <button onClick={() => dispatch(newContent())}>
                <FormattedMessage id='newContent' />
            </button>
            {contentId && (
                <button onClick={() => dispatch(cloneContent())}>
                    <FormattedMessage id='cloneContent' />
                </button>
            )}
            <div className="spacer" />
            {mode !== 'search' && (
                <button
                    disabled={saving}
                    onClick={() => saveAndClose(style, belowFold, fullscreenImageOnClick, dispatch, contentService, editorTarget)}>
                    <FormattedMessage id='save' />
                </button>
            )}
            <a href="javascript:void(0)" onClick={() => editorTarget.close()}>
                <FormattedMessage id='cancel' />
            </a>
        </div>
    );
};
