
import React, {useContext} from 'react';
import ReactMde from 'react-mde';
import {useSelector, useDispatch} from 'react-redux';
import {FormattedMessage, IntlContext} from 'react-intl';
import imageCommand from '../commands/imageCommand';
import videoCommand from '../commands/videoCommand';
import youtubeCommand from '../commands/youtubeCommand';
import vimeoCommand from '../commands/vimeoCommand';
import {setContentMarkdown, setContentTitle, setSelectedLanguage, removeEditorLanguage} from '../store/actions';
import ContentEditorIcon from './ContentEditorIcon';
import EditorContext from '../EditorContext';

import type {EditorState, EditorDispatch} from '../../types';

export default () => {
    const {contentType, contentProp, titleProp} = useSelector((state: EditorState) => state.config);
    const {contentId, i18nContent, selectedLanguage, defaultLanguage, possibleLanguages, loading, loadingError} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch() as EditorDispatch;
    const {portalAppService, messageBus} = useContext(EditorContext);
    const {formatMessage} = useContext(IntlContext);

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
                        <ReactMde
                            toolbarCommands={[
                                ['bold', 'italic', 'strikethrough'],
                                ['link', 'unordered-list', 'ordered-list'],
                                ['image', 'video', 'vimeo', 'youtube']
                            ]}
                            commands={{
                                image: imageCommand(formatMessage({ id: 'selectImage' }), portalAppService, messageBus),
                                video: videoCommand(formatMessage({ id: 'selectVideo' }), portalAppService, messageBus),
                                vimeo: vimeoCommand,
                                youtube: youtubeCommand,
                            }}
                            getIcon={(iconName) => <ContentEditorIcon iconName={iconName} />}
                            value={markdown}
                            onChange={(markdown) => dispatch(setContentMarkdown(selectedLanguage, contentProp, markdown))}
                            minEditorHeight={350}
                            disablePreview
                        />
                    </div>
                </>
            )}
        </div>
    );
};
