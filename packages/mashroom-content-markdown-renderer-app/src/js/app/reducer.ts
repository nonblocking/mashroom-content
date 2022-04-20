
import type {AppState} from '../types';

type Action =
    | { type: 'setMarkdown', markdown: string | undefined }
    | { type: 'error' };

export const EMPTY_STATE: AppState = { markdown: undefined, error: false };

export default (state: AppState, action: Action) => {
    switch (action.type) {
        case 'setMarkdown':
            return {
                ...state,
                markdown: action.markdown,
            };
        case 'error':
            return {
                ...state,
                error: true,
            };
        default:
            throw new Error(`Invalid action: ${JSON.stringify(action)}`);
    }
}
