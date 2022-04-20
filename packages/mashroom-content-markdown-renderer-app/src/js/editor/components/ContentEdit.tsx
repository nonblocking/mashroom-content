
import React, {useContext, useEffect} from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {addLanguage, loadContent, setEditorTab} from '../store/actions';
import ContentEditContent from './ContentEditContent';
import ContentEditStyle from './ContentEditStyle';
import ContentEditPreview from './ContentEditPreview';
import EditorContext from '../EditorContext';

import type {EditorState, EditorTab} from '../../types';

type Tab = {
    id: EditorTab;
    title: string;
}

const TABS: Array<Tab> = [
    { id: 'content', title: 'tabContent' },
    { id: 'style', title: 'tabStyle' },
    { id: 'preview', title: 'tabPreview' },
];

export default () => {
    const activeTabId = useSelector((state: EditorState) => state.tab);
    const {contentId, i18nContent, selectedLanguage, existingTranslations} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch();
    const {contentService} = useContext(EditorContext);
    useEffect(() => {
        if (selectedLanguage && !i18nContent[selectedLanguage]) {
            if (existingTranslations && existingTranslations.indexOf(selectedLanguage) === -1) {
                dispatch(addLanguage(selectedLanguage));
            } else if (contentId) {
                dispatch(loadContent(contentId, selectedLanguage, contentService));
            }
        }
    }, [contentId, selectedLanguage]);

    if (!selectedLanguage || !i18nContent[selectedLanguage]) {
        return null;
    }

    return (
        <div className='content-edit'>
            <div className="mashroom-portal-ui-tab-dialog">
                <div className="tab-dialog-header">
                    {
                        TABS.map(({id, title}) => (
                            <div key={id} className={`tab-dialog-button ${activeTabId === id ? 'active' : ''}`} onClick={() => dispatch(setEditorTab(id))}>
                                <div className="title">
                                    <FormattedMessage id={title} />
                                </div>
                            </div>
                        ))
                    }
                </div>
                <div className="tab-content">
                    {activeTabId === 'content' && <ContentEditContent />}
                    {activeTabId === 'style' && <ContentEditStyle />}
                    {activeTabId === 'preview' && <ContentEditPreview />}
                </div>
            </div>
        </div>
    );
};
