import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

const defaultConfiguration = 'id=766020840';

const vimeoCommand: EditorCommand = (cm) => {
    insertAtSelection(cm, `::vimeo{${defaultConfiguration}}`, 8, defaultConfiguration.length +  8);
};

export default vimeoCommand;
