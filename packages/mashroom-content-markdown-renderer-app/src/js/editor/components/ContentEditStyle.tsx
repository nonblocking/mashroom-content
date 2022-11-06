
import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import CodeMirror from '@uiw/react-codemirror';
import {githubLight} from '@uiw/codemirror-theme-github';
import {css} from '@codemirror/lang-css';
import {setStyle, setBelowFold, setFullscreenImageOnClick} from '../store/actions';

import type {EditorState} from '../../types';

export default () => {
    const {style, belowFold, fullscreenImageOnClick} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch();

    const extensions = [];
    extensions.push(css());

    return (
        <div className="content-edit-style">
            <div className='form-row'>
                <input id="belowFold"type="checkbox" checked={belowFold} onChange={(e) => dispatch(setBelowFold(e.target.checked))} />
                <label htmlFor="belowFold">
                    <FormattedMessage id='belowFold' />
                </label>
            </div>
            <div className='form-row'>
                <input id="fullscreenImageOnClick"type="checkbox" checked={fullscreenImageOnClick} onChange={(e) => dispatch(setFullscreenImageOnClick(e.target.checked))} />
                <label htmlFor="fullscreenImageOnClick">
                    <FormattedMessage id='fullscreenImageOnClick' />
                </label>
            </div>
            <div className='form-row'>
               <div className="css-editor">
                   <CodeMirror
                       value={style || ''}
                       theme={githubLight}
                       extensions={extensions}
                       basicSetup={{
                           lineNumbers: false,
                           foldGutter: false,
                           syntaxHighlighting: true,
                           autocompletion: true,
                           closeBrackets: true,
                           highlightActiveLine: false,
                       }}
                       onChange={(value) => {
                           dispatch(setStyle(value));
                       }}
                   />
               </div>
            </div>
        </div>
    );
};
