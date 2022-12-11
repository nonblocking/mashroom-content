import insertAtSelection from './insertAtSelection';
import type {EditorCommand} from '../../types';

const defaultConfiguration = 'id=612710291 privateKey=dba51808e0';

const vimeoCommand: EditorCommand = (cm) => {
    insertAtSelection(cm, `::vimeo{${defaultConfiguration}}`, 8, defaultConfiguration.length +  8);
};

export default vimeoCommand;
