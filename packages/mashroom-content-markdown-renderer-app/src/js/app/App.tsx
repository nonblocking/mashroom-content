
import React, {useEffect, useReducer} from 'react';
import Markdown from '../common/Markdown';
import messages from './messages';
import reducer from './reducer';

import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {AppState} from '../types';

type Props = {
    contentType: string;
    contentProp: string;
    contentId: string | undefined | null;
    style: string | undefined | null;
    appId: string;
    lang: string;
    initialState: AppState;
    belowFold: boolean;
    fullscreenImageOnClick: boolean;
    imageBreakpoints: Array<number>;
    imagePreferredFormats: Array<string>;
    contentService: MashroomContentClientService;
}

export default ({contentType, contentProp, contentId, appId, style, lang, initialState, belowFold, fullscreenImageOnClick, imageBreakpoints, imagePreferredFormats, contentService}: Props) => {
    const [state, dispatch] = useReducer(reducer, initialState);
    useEffect(() => {
        if (!initialState.markdown) {
            if (contentId) {
                contentService.getContent<any>(contentType, contentId).then(
                    (content) => {
                        dispatch({ type: 'setMarkdown', markdown: content.data[contentProp] });
                    }
                ).catch((error) => {
                    console.error('Error loading content', error);
                    dispatch({ type: 'error' });
                });
            }
        }
    }, []);

    const {error, markdown} = state;
    const localizedMessages = messages[lang] || messages.en;

    if (!contentId) {
        return null;
    }

    return (
        <div className="mashroom-content-markdown-renderer-app">
            {error && (
                <div className='mashroom-portal-ui-error-message' >
                    {localizedMessages['loadingFailed']}
                </div>
            )}
            {!markdown && !error && (
                <div className="mashroom-portal-app-loading" >
                    <span />
                </div>
            )}
            {markdown && (
                <Markdown
                    markdown={markdown}
                    style={style}
                    cssPrefixClass={`_${appId}`}
                    belowFold={belowFold}
                    fullscreenImageOnClick={fullscreenImageOnClick}
                    imageBreakpoints={imageBreakpoints}
                    imagePreferredFormats={imagePreferredFormats}
                />
            )}
        </div>
    );
};
