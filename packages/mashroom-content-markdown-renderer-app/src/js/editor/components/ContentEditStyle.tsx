
import React from 'react';
import {useSelector, useDispatch} from 'react-redux';
import {FormattedMessage} from 'react-intl';
import {Controlled as CodeMirror} from 'react-codemirror2'
import 'codemirror/mode/css/css';
import {setStyle, setBelowFold, setFullscreenImageOnClick} from '../store/actions';

import type {EditorState} from '../../types';

export default () => {
    const {style, belowFold, fullscreenImageOnClick} = useSelector((state: EditorState) => state.content);
    const dispatch = useDispatch();

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
                       options={{
                           mode: 'css',
                           theme: 'idea',
                           lineNumbers: true
                       }}
                       onBeforeChange={(editor, data, value) => {
                           dispatch(setStyle(value));
                       }}
                   />
               </div>
            </div>
        </div>
    );
};
