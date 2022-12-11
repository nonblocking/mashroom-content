import wrapSelection from './wrapSelection';
import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

export default (defaultLabel: string) => {
    const linkCommand: EditorCommand = (cm) => {
        const success = wrapSelection(cm, (text) => `[${text}](https://the-link-target.com)`, 1);
        if (!success) {
            insertAtSelection(cm, `[${defaultLabel}](https://the-link-target.com)`, 1, defaultLabel.length + 1);
        }
    };
    return linkCommand;
};
