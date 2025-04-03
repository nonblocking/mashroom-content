
import React, {useRef} from 'react';
import CodeMirror, {type ReactCodeMirrorRef} from '@uiw/react-codemirror';
import {githubLight} from '@uiw/codemirror-theme-github';
import {markdown as markdownEditor, markdownLanguage} from '@codemirror/lang-markdown';
import {languages} from '@codemirror/language-data';
import {useSelector, useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {setContentMarkdown, setContentTitle, setSelectedLanguage, removeEditorLanguage} from '../store/actions';


import ContentEditorContentToolbar from './ContentEditorContentToolbar';
import type {EditorState, EditorDispatch} from '../../types';

export default () => {
    const {contentType, contentProp, titleProp} = useSelector((state: EditorState) => state.config);
    const {contentId, i18nContent, selectedLanguage, defaultLanguage, possibleLanguages, loading, loadingError} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch() as EditorDispatch;
    const cmRef = useRef<ReactCodeMirrorRef>(null);

    if (!selectedLanguage || !i18nContent[selectedLanguage]) {
        return null;
    }
    const content = i18nContent[selectedLanguage];
    const markdown = content[contentProp];
    const title = content[titleProp];

    return (
        <div className="content-edit-content">
            {loading && (
                <div className="mashroom-portal-app-loading" >
                    <span />
                </div>
            )}
            {loadingError && (
                <div className="mashroom-portal-app-loading-error" >
                    <FormattedMessage id='loadingFailed' />
                </div>
            )}
            {!loading && !loadingError && (
                <>
                    <div className='form-row horizontal'>
                        <label htmlFor="contentType">
                            <FormattedMessage id='contentType' />
                        </label>
                        <div>
                            <em>{contentType}</em>
                        </div>
                    </div>
                    <div className='form-row horizontal'>
                        <label htmlFor="contentId">
                            <FormattedMessage id='contentId' />
                        </label>
                        <div>
                            <em>{contentId}</em>
                            {!contentId && <FormattedMessage id="newContentId" />}
                        </div>
                    </div>
                    <div className='form-row horizontal'>
                        <label htmlFor="contentLanguage">
                            <FormattedMessage id='contentLanguage' />
                        </label>
                        <select
                            id="contentLanguage"
                            value={selectedLanguage}
                            onChange={(e) => dispatch(setSelectedLanguage(e.target.value))}>
                            {
                                possibleLanguages?.map((lang) => (
                                    <option key={lang} value={lang}>{lang}</option>
                                ))
                            }
                        </select>
                    </div>
                    {selectedLanguage !== defaultLanguage && (
                        <div className='form-row'>
                            <a href="javascript:void(0)" onClick={() => dispatch(removeEditorLanguage(selectedLanguage))}>
                                <FormattedMessage id='removeLanguage' />
                            </a>
                        </div>
                    )}
                    <div className='form-row horizontal'>
                        <label htmlFor="contentTitle">
                            <FormattedMessage id='contentTitle' />
                        </label>
                        <input id="contentTitle" type="text" value={title} onChange={(e) => dispatch(setContentTitle(selectedLanguage, titleProp, e.target.value))}/>
                    </div>
                    <div className='form-row'>
                        <label htmlFor="markdownContent">
                            <FormattedMessage id='contentMarkdown' />
                        </label>
                        <div className='markdown-editor'>
                            <ContentEditorContentToolbar codeMirrorRef={cmRef} />
                            <CodeMirror
                                ref={cmRef}
                                value={markdown}
                                height="3ßßpx"
                                theme={githubLight}
                                basicSetup={{
                                    lineNumbers: false,
                                    foldGutter: false,
                                    syntaxHighlighting: true,
                                    autocompletion: true,
                                    closeBrackets: true,
                                    highlightActiveLine: false,
                                }}
                                extensions={[markdownEditor({
                                    base: markdownLanguage,
                                    codeLanguages: languages
                                })]}
                                onChange={(value) => {
                                    dispatch(setContentMarkdown(selectedLanguage, contentProp, value));
                                }}
                            />
                        </div>

                    </div>
                </>
            )}
        </div>
    );
};
