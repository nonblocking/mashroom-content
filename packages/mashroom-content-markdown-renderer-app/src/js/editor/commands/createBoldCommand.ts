import wrapSelection from './wrapSelection';
import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

export default (defaultText: string) => {
    const createBoldCommand: EditorCommand = (cm) => {
        const success = wrapSelection(cm, (text) => `**${text}**`, 2);
        if (!success) {
            insertAtSelection(cm, `**${defaultText}**`, 2, defaultText.length + 2);
        }
    };
    return createBoldCommand;
};
