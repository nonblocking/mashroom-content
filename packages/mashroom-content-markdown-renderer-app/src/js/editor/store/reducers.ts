import {combineReducers} from 'redux';
import {
    SET_EDITOR_CONFIG,
    SET_EDITOR_MODE,
    SET_EDITOR_TAB,
    SET_CONTENT_ID,
    SET_I18N_CONTENT,
    SET_CONTENT_MARKDOWN,
    SET_CONTENT_TITLE,
    SET_STYLE,
    SET_BELOW_FOLD,
    SET_FULLSCREEN_IMAGE_ON_CLICK,
    SET_SELECTED_LANGUAGE,
    ADD_LANGUAGE,
    REMOVE_LANGUAGE,
    SET_DEFAULT_LANGUAGE,
    SET_POSSIBLE_LANGUAGES,
    ADD_REMOVED_LANGUAGE,
    SET_EXISTING_TRANSLATIONS,
    SET_CONTENT_LOADING,
    SET_CONTENT_LOADING_ERROR,
    SET_CONTENT_SAVING,
    SET_CONTENT_SAVING_ERROR,
    SET_SEARCH_QUERY,
    SET_SEARCH_RESULT,
    SET_SEARCH_RUNNING,
    SET_SEARCH_ERROR,
} from './actions';

import type {Reducer} from 'redux';
import type {EditorConfig, EditorContent, EditorMode, EditorSearch, EditorState, EditorTab} from '../../types';

const config: Reducer<EditorConfig> = (state, action): EditorConfig => {
    if (!state) {
        return {
            contentType: 'markdown',
            contentProp: 'content',
            titleProp: 'title',
        };
    }

    switch (action.type) {
        case SET_EDITOR_CONFIG: {
            return action.editorConfig;
        }
        default:
            return state;
    }
};

const mode: Reducer<EditorMode> = (state, action): EditorMode => {
    if (!state) {
        return 'search';
    }

    switch (action.type) {
        case SET_EDITOR_MODE: {
            return action.editorMode;
        }
        default:
            return state;
    }
};

const tab: Reducer<EditorTab> = (state, action): EditorTab => {
    if (!state) {
        return 'content';
    }

    switch (action.type) {
        case SET_EDITOR_TAB: {
            return action.editorTab;
        }
        default:
            return state;
    }
};

const content: Reducer<EditorContent> = (state, action): EditorContent => {
    if (!state) {
        return {
            contentId: undefined,
            i18nContent: {},
            defaultLanguage: undefined,
            selectedLanguage: undefined,
            existingTranslations: undefined,
            possibleLanguages: undefined,
            removedLanguages: [],
            style: undefined,
            belowFold: false,
            fullscreenImageOnClick: true,
            loading: false,
            loadingError: false,
            saving: false,
            savingError: false,
        };
    }

    switch (action.type) {
        case SET_CONTENT_ID: {
            return {
                ...state,
                contentId: action.contentId,
            };
        }
        case SET_I18N_CONTENT: {
            return {
                ...state,
                i18nContent: action.i18nContent,
            };
        }
        case SET_CONTENT_MARKDOWN: {
            const lang = action.lang;
            return {
                ...state,
                i18nContent: {
                    ...state.i18nContent,
                    [lang]: {
                        ...state.i18nContent[lang!],
                        [action.contentProp]: action.contentMarkdown,
                    }
                }
            };
        }
        case SET_CONTENT_TITLE: {
            const lang = action.lang;
            return {
                ...state,
                i18nContent: {
                    ...state.i18nContent,
                    [lang]: {
                        ...state.i18nContent[lang!],
                        [action.titleProp]: action.contentTitle,
                    }
                }
            };
        }
        case SET_STYLE: {
            return {
                ...state,
                style: action.style,
            };
        }
        case SET_BELOW_FOLD: {
            return {
                ...state,
                belowFold: action.belowFold,
            };
        }
        case SET_FULLSCREEN_IMAGE_ON_CLICK: {
            return {
                ...state,
                fullscreenImageOnClick: action.fullscreenImageOnClick,
            };
        }
        case SET_SELECTED_LANGUAGE: {
            return {
                ...state,
                selectedLanguage: action.lang,
            };
        }
        case ADD_LANGUAGE: {
            const {i18nContent, existingTranslations} = state;
            const updatedI18nContent = {
                ...i18nContent,
                [action.lang]: {
                    content: '',
                    title: '',
                }
            };
            const updatedExistingTranslations = [...existingTranslations || []];
            if (updatedExistingTranslations.indexOf(action.lang) === -1) {
                updatedExistingTranslations.push(action.lang);
            }
            return {
                ...state,
                i18nContent: updatedI18nContent,
                existingTranslations: updatedExistingTranslations,
            };
        }
        case REMOVE_LANGUAGE: {
            const {i18nContent} = state;
            const updatedI18nContent = {
                ...i18nContent,
            };
            delete updatedI18nContent[action.lang];
            return {
                ...state,
                i18nContent: updatedI18nContent,
            };
        }
        case SET_DEFAULT_LANGUAGE: {
            return {
                ...state,
                defaultLanguage: action.lang,
            };
        }
        case SET_POSSIBLE_LANGUAGES: {
            return {
                ...state,
                possibleLanguages: action.languages,
            };
        }
        case ADD_REMOVED_LANGUAGE: {
            return {
                ...state,
                removedLanguages: [...state.removedLanguages, action.lang],
            };
        }
        case SET_EXISTING_TRANSLATIONS: {
            return {
                ...state,
                existingTranslations: action.languages,
            };
        }
        case SET_CONTENT_LOADING: {
            return {
                ...state,
                loading: action.loading,
            };
        }
        case SET_CONTENT_LOADING_ERROR: {
            return {
                ...state,
                loadingError: action.error,
            };
        }
        case SET_CONTENT_SAVING: {
            return {
                ...state,
                saving: action.saving,
            };
        }
        case SET_CONTENT_SAVING_ERROR: {
            return {
                ...state,
                savingError: action.error,
            };
        }
        default:
            return state;
    }
};

const search: Reducer<EditorSearch> = (state, action): EditorSearch => {
    if (!state) {
        return {
            query: '',
            result: undefined,
            running: false,
            error: false,
        };
    }

    switch (action.type) {
        case SET_SEARCH_QUERY: {
            return {
                ...state,
                query: action.query,
            };
        }
        case SET_SEARCH_RESULT: {
            return {
                ...state,
                result: action.result,
            };
        }
        case SET_SEARCH_RUNNING: {
            return {
                ...state,
                running: action.running,
            };
        }
        case SET_SEARCH_ERROR: {
            return {
                ...state,
                error: action.error,
            };
        }
        default:
            return state;
    }
};

export default combineReducers<EditorState>({
    config,
    mode,
    tab,
    content,
    search,
});
