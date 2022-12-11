import React, { useContext, useMemo} from 'react';
import {useIntl} from 'react-intl';
import EditorContext from '../EditorContext';
import createBoldCommand from '../commands/createBoldCommand';
import createItalicCommand from '../commands/createItalicCommand';
import createStrikethroughCommand from '../commands/createStrikethroughCommand';
import createLinkCommand from '../commands/createLinkCommand';
import createImageCommand from '../commands/createImageCommand';
import createVideoCommand from '../commands/createVideoCommand';
import vimeoCommand from '../commands/vimeoCommand';
import youtubeCommand from '../commands/youtubeCommand';
import ContentEditorIcon from './ContentEditorIcon';
import type {EditorCommand} from '../../types';
import type {RefObject} from 'react';
import type {ReactCodeMirrorRef} from '@uiw/react-codemirror';

const executeCommand = (codeMirrorRef: RefObject<ReactCodeMirrorRef>, command: EditorCommand) => () => {
    if (codeMirrorRef.current) {
        command(codeMirrorRef.current);
    }
};

type Props = {
    codeMirrorRef: RefObject<ReactCodeMirrorRef>;
}

export default ({codeMirrorRef}: Props) => {
    const intl = useIntl();
    const {portalAppService, messageBus} = useContext(EditorContext);
    const boldCommand = useMemo(() => {
        const defaultText = intl.formatMessage({ id: 'insertCommandDefaultText' });
        return createBoldCommand(defaultText);
    }, []);
    const italicCommand = useMemo(() => {
        const defaultText = intl.formatMessage({ id: 'insertCommandDefaultText' });
        return createItalicCommand(defaultText);
    }, []);
    const strikethroughCommand = useMemo(() => {
        const defaultText = intl.formatMessage({ id: 'insertCommandDefaultText' });
        return createStrikethroughCommand(defaultText);
    }, []);
    const linkCommand = useMemo(() => {
        const defaultLinkLabel = intl.formatMessage({ id: 'linkCommandDefaultLabel' });
        return createLinkCommand(defaultLinkLabel);
    }, []);
    const imageCommand = useMemo(() => {
        const modalTitle = intl.formatMessage({ id: 'selectImage' });
        return createImageCommand(modalTitle, portalAppService, messageBus);
    }, [portalAppService, messageBus]);
    const videoCommand = useMemo(() => {
        const modalTitle = intl.formatMessage({ id: 'selectVideo' });
        return createVideoCommand(modalTitle, portalAppService, messageBus);
    }, [portalAppService, messageBus]);

    return (
        <div className='content-edit-content-toolbar'>
            <ContentEditorIcon iconName='bold' onClick={executeCommand(codeMirrorRef, boldCommand)} />
            <ContentEditorIcon iconName='italic' onClick={executeCommand(codeMirrorRef, italicCommand)} />
            <ContentEditorIcon iconName='strikethrough' onClick={executeCommand(codeMirrorRef, strikethroughCommand)} />
            <ContentEditorIcon iconName='link' onClick={executeCommand(codeMirrorRef, linkCommand)} />
            <ContentEditorIcon iconName='image' onClick={executeCommand(codeMirrorRef, imageCommand)} />
            <ContentEditorIcon iconName='video' onClick={executeCommand(codeMirrorRef, videoCommand)} />
            <ContentEditorIcon iconName='vimeo' onClick={executeCommand(codeMirrorRef, vimeoCommand)} />
            <ContentEditorIcon iconName='youtube' onClick={executeCommand(codeMirrorRef, youtubeCommand)} />
        </div>
    )
}
