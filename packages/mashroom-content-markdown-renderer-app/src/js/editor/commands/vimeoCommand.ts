import type {Command} from 'react-mde';

const vimeoCommand: Command = {
    execute: (opts) => {
        opts.textApi.replaceSelection('::vimeo{id=612710291 privateKey=dba51808e0}');
    }
};

export default vimeoCommand;
