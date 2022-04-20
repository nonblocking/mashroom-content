import {combineReducers} from 'redux';
import {
    SET_CONFIG,
    SET_CONTENT_FILTER,
    SET_SEARCH_QUERY,
    SET_SEARCH_SKIP,
    SET_SEARCH_RESULT,
    SET_SEARCH_RUNNING,
    SET_SEARCH_ERROR,
    SEARCH_RESULT_APPEND,
    SEARCH_RESULT_REMOVE_ASSET,
    ADD_UPLOAD,
    SET_UPLOAD_PROGRESS,
    SET_UPLOAD_ERROR,
    REMOVE_UPLOAD,
} from './actions';

import type {Reducer} from 'redux';
import type {Config, Search, State, Uploads} from '../types';

const config: Reducer<Config> = (state, action): Config => {
    if (!state) {
        return {
            modalMode: false,
            typeFilter: null,
            responseChannelTopic: 'media-library-response',
        };
    }

    switch (action.type) {
        case SET_CONFIG: {
            return action.config;
        }
        default:
            return state;
    }
};

const search: Reducer<Search> = (state, action): Search => {
    if (!state) {
        return {
            typeFilter: null,
            query: '',
            skip: undefined,
            result: undefined,
            running: false,
            error: false,
        };
    }

    switch (action.type) {
        case SET_CONTENT_FILTER: {
            return {
                ...state,
                typeFilter: action.typeFilter,
            };
        }
        case SET_SEARCH_QUERY: {
            return {
                ...state,
                query: action.query,
            };
        }
        case SET_SEARCH_SKIP: {
            return {
                ...state,
                skip: action.skip,
            };
        }
        case SET_SEARCH_RESULT: {
            return {
                ...state,
                result: action.result,
            };
        }
        case SEARCH_RESULT_APPEND: {
            return {
                ...state,
                result: {
                    hits: [
                        ...state.result?.hits || [],
                        ...action.assets,
                    ],
                    meta: {
                        total: state.result?.meta.total || 1,
                    }
                }
            }
        }
        case SEARCH_RESULT_REMOVE_ASSET: {
            return {
                ...state,
                result: {
                    hits: (state.result?.hits || []).filter((asset) => {
                        return asset.id !== action.id;
                    }),
                    meta: state.result?.meta || { total: 0 },
                }
            }
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

const uploads: Reducer<Uploads> = (state, action): Uploads => {
    if (!state) {
        return [];
    }

    switch (action.type) {
        case ADD_UPLOAD: {
            return [
                action.upload,
                ...state,
            ];
        }
        case SET_UPLOAD_PROGRESS: {
            return state.map((upload) => {
                if (upload.id === action.id) {
                    return {
                        ...upload,
                        progress: action.progress,
                    };
                }
                return upload;
            });
        }
        case SET_UPLOAD_ERROR: {
            return state.map((upload) => {
                if (upload.id === action.id) {
                    return {
                        ...upload,
                        error: action.error,
                    };
                }
                return upload;
            });
        }
        case REMOVE_UPLOAD: {
            return state.filter((upload) => {
                return upload.id !== action.id;
            });
        }
        default:
            return state;
    }
};

export default combineReducers<State>({
    config,
    search,
    uploads,
});
