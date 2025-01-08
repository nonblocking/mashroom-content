import {nanoid} from 'nanoid';

import type {
    MashroomContentClientService,
    MashroomContentAssetSearchResult,
    MashroomContentAsset, PromiseWithProgressAndCancel
} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {State, Dispatch, Upload, Config} from '../types';

export const SET_CONFIG = 'SET_CONFIG';

export const SET_CONTENT_FILTER = 'SET_CONTENT_FILTER';
export const SET_SEARCH_QUERY = 'SET_SEARCH_QUERY';
export const SET_SEARCH_SKIP = 'SET_SEARCH_SKIP';
export const SET_SEARCH_RESULT = 'SET_SEARCH_RESULT';
export const SET_SEARCH_RUNNING = 'SET_SEARCH_RUNNING';
export const SET_SEARCH_ERROR = 'SET_SEARCH_ERROR';
export const SEARCH_RESULT_APPEND = 'SEARCH_RESULT_APPEND';
export const SEARCH_RESULT_REMOVE_ASSET = 'SEARCH_RESULT_REMOVE_ASSET';

export const ADD_UPLOAD = 'ADD_UPLOAD';
export const SET_UPLOAD_PROGRESS = 'SET_UPLOAD_PROGRESS';
export const SET_UPLOAD_ERROR = 'SET_UPLOAD_ERROR';
export const REMOVE_UPLOAD = 'REMOVE_UPLOAD';

export const setConfig = (config: Config) => ({type: SET_CONFIG, config});

export const setTypeFilter = (typeFilter: string | null) => ({type: SET_CONTENT_FILTER, typeFilter});
export const setSearchQuery = (query: string | null) => ({type: SET_SEARCH_QUERY, query});
export const setSearchSkip = (skip: number | undefined) => ({type: SET_SEARCH_SKIP, skip});
export const setSearchResult = (result: MashroomContentAssetSearchResult | undefined) => ({ type: SET_SEARCH_RESULT, result });
export const setSearchRunning = (running: boolean) => ({type: SET_SEARCH_RUNNING, running});
export const setSearchError = (error: boolean) => ({type: SET_SEARCH_ERROR, error});
export const searchResultAppend = (assets: Array<MashroomContentAsset>) => ({ type: SEARCH_RESULT_APPEND, assets });
export const searchResultRemoveAsset = (id: string) => ({ type: SEARCH_RESULT_REMOVE_ASSET, id  });

export const addUpload = (upload: Upload) => ({type: ADD_UPLOAD, upload});
export const setUploadProgress = (id: string, progress: number) => ({type: SET_UPLOAD_PROGRESS, id, progress});
export const setUploadError = (id: string, error: boolean) => ({type: SET_UPLOAD_ERROR, id, error});
export const removeUpload = (id: string) => ({type: REMOVE_UPLOAD, id});

const runningUploads: Record<string, PromiseWithProgressAndCancel<any> | undefined> = {};

export const searchAssets = (contentService: MashroomContentClientService, limit?: number, skip?: number) => (dispatch: Dispatch, getState: () => State) => {
    const {search: {typeFilter, query}} = getState();

    dispatch(setSearchRunning(true));
    contentService.searchAssets(typeFilter || undefined, query || undefined, limit, skip).then(
        (result) => {
            if (!skip) {
                dispatch(setSearchResult(result));
            } else {
                dispatch(searchResultAppend(result.hits));
            }
            dispatch(setSearchRunning(false));
        }
    ).catch((error) => {
        console.error('Error searching assets', error);
        dispatch(setSearchRunning(false));
        dispatch(setSearchError(true));
    });
};

export const uploadFile = (contentService: MashroomContentClientService, file: File) => (dispatch: Dispatch, getState: () => State) => {
    const id = nanoid(8);
    const upload: Upload = {
        id,
        file,
        progress: 0,
        error: false,
    };
    dispatch(addUpload(upload));

    const runningUpload = contentService.uploadAsset(file);
    runningUploads[id] = runningUpload;
    runningUpload.then(
        (asset) => {
            console.info(`Upload succeeded: ${file.name}`);
            dispatch(removeUpload(id));
            const result = getState().search.result;
            dispatch(setSearchResult({
                hits: [
                    asset,
                    ...result?.hits || [],
                ],
                meta: {
                    total: result ? result.meta.total + 1 : 1,
                },
            }));
            delete runningUploads[id];
        },
        (error) => {
            console.error(`Upload of file ${file.name} failed`, error);
            dispatch(setUploadError(id, true));
            delete runningUploads[id];
        },
        ({progress}) => {
            dispatch(setUploadProgress(id, progress));
        }
    );
};

export const cancelUploadFile = (id: string) => (dispatch: Dispatch) => {
    runningUploads[id]?.cancel();
    dispatch(removeUpload(id));
};

export const removeAsset = (contentService: MashroomContentClientService, id: string) => (dispatch: Dispatch) => {
    contentService.removeAsset(id).then(
        () => {
            dispatch(searchResultRemoveAsset(id));
        },
        (error) => {
            console.error('Removing asset failed', error);
        }
    );
};
