import type {Command} from 'react-mde';

const youtubeCommand: Command = {
    execute: (opts) => {
        opts.textApi.replaceSelection('::youtube{id=z9eoubnO-pE}');
    }
};

export default youtubeCommand;
