
import React, {useContext} from 'react';
import {useSelector} from 'react-redux';
import Markdown from '../../common/Markdown';
import EditorContext from '../EditorContext';

import type {EditorState} from '../../types';

export default () => {
    const {i18nContent, selectedLanguage, style, belowFold, fullscreenImageOnClick} = useSelector((state: EditorState) => state.content);
    const {appId, contentService} = useContext(EditorContext);

    if (!selectedLanguage || !i18nContent[selectedLanguage]) {
        return null;
    }
    const {content: markdown} = i18nContent[selectedLanguage];

    return (
        <div className="content-edit-preview">
           <Markdown
               markdown={markdown}
               style={style}
               cssPrefixClass={`_${appId}`}
               belowFold={belowFold}
               fullscreenImageOnClick={fullscreenImageOnClick}
               imageBreakpoints={contentService.imageBreakpoints}
               imagePreferredFormats={contentService.imagePreferredFormats}
           />
        </div>
    );
};
