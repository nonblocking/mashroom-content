
import React, {useEffect, useState, useContext} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {IntlProvider} from 'react-intl';
import MainActions from './MainActions';
import GlobalMessages from './GlobalMessages';
import ContentSearch from './ContentSearch';
import ContentEdit from './ContentEdit';
import {
    setPossibleLanguages,
    setBelowFold,
    setContentId,
    setEditorMode,
    setFullscreenImageOnClick,
    setSelectedLanguage,
    setStyle,
    setDefaultLanguage, addLanguage, setEditorConfig,
} from '../store/actions';
import loadMessages from '../messages';
import EditorContext from '../EditorContext';

import type {MashroomPortalConfigEditorTarget} from '@mashroom/mashroom-portal/type-definitions';
import type {EditorState} from '../../types';

type Props = {
    editorTarget: MashroomPortalConfigEditorTarget;
}

export default ({editorTarget}: Props) => {
    const mode = useSelector((state: EditorState) => state.mode);
    const [messages, setMessages] = useState<Record<string, string>>({});
    const dispatch = useDispatch();
    const {lang, portalUserService} = useContext(EditorContext);
    useEffect(() => {
        const {contentType, contentProp, titleProp, contentId, style, belowFold, fullscreenImageOnClick} = editorTarget.appConfig;
        dispatch(setEditorConfig({contentType, contentProp, titleProp}));
        dispatch(setContentId(contentId));
        dispatch(setStyle(style));
        dispatch(setBelowFold(belowFold));
        dispatch(setFullscreenImageOnClick(fullscreenImageOnClick));
        dispatch(setEditorMode('edit'));
        portalUserService.getDefaultLanguage().then((lang) => {
            dispatch(setDefaultLanguage(lang));
            dispatch(setSelectedLanguage(lang));
            if (!contentId) {
                dispatch(addLanguage(lang));
            }
        });
        portalUserService.getAvailableLanguages().then((languages) => dispatch(setPossibleLanguages(languages)));
        loadMessages(lang).then((messages) => setMessages((messages)));
    }, []);

    if (Object.keys(messages).length === 0) {
        return null;
    }

    return (
        <IntlProvider messages={messages} locale={lang}>
            <div className='mashroom-content-markdown-renderer-app-config-editor'>
                <MainActions editorTarget={editorTarget} />
                <GlobalMessages />
                {mode === 'search' && <ContentSearch />}
                {mode === 'edit' && <ContentEdit />}
            </div>
        </IntlProvider>
    );
};
