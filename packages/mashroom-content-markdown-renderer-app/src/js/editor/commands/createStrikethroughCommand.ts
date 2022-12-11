import wrapSelection from './wrapSelection';
import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

export default (defaultText: string) => {
    const strikethroughCommand: EditorCommand = (cm) => {
        const success = wrapSelection(cm, (text) => `~${text}~`, 1);
        if (!success) {
            insertAtSelection(cm, `~${defaultText}~`, 1, defaultText.length + 1);
        }
    };
    return strikethroughCommand;
};
