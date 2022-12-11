import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

const defaultConfiguration = 'id=z9eoubnO-pE';

const youtubeCommand: EditorCommand = (cm) => {
    insertAtSelection(cm, `::youtube{${defaultConfiguration}}`, 10, defaultConfiguration.length + 10);
};

export default youtubeCommand;
