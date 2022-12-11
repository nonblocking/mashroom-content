
import type {MashroomContentClientService, MashroomContentApiContentSearchResult,MashroomContentApiContentWrapper} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {EditorConfig, EditorDispatch, EditorMode, EditorState, EditorTab} from '../../types';

export const SET_EDITOR_CONFIG = 'SET_EDITOR_CONFIG';
export const SET_EDITOR_MODE = 'SET_EDITOR_MODE';
export const SET_EDITOR_TAB = 'SET_EDITOR_TAB';
export const SET_CONTENT_ID = 'SET_CONTENT_ID';
export const SET_I18N_CONTENT = 'SET_I18N_CONTENT';
export const SET_CONTENT_MARKDOWN = 'SET_CONTENT_MARKDOWN';
export const SET_CONTENT_TITLE = 'SET_CONTENT_TITLE';
export const SET_STYLE = 'SET_STYLE';
export const SET_BELOW_FOLD = 'SET_BELOW_FOLD';
export const SET_FULLSCREEN_IMAGE_ON_CLICK = 'SET_FULLSCREEN_IMAGE_ON_CLICK';
export const SET_SELECTED_LANGUAGE = 'SET_SELECTED_LANGUAGE';
export const ADD_LANGUAGE = 'ADD_LANGUAGE';
export const REMOVE_LANGUAGE = 'REMOVE_LANGUAGE';
export const SET_DEFAULT_LANGUAGE = 'SET_DEFAULT_LANGUAGE';
export const SET_POSSIBLE_LANGUAGES = 'SET_POSSIBLE_LANGUAGES';
export const SET_EXISTING_TRANSLATIONS = 'SET_EXISTING_TRANSLATIONS';
export const ADD_REMOVED_LANGUAGE = 'ADD_REMOVED_LANGUAGE';
export const SET_CONTENT_LOADING = 'SET_CONTENT_LOADING';
export const SET_CONTENT_LOADING_ERROR = 'SET_CONTENT_LOADING_ERROR';
export const SET_CONTENT_SAVING = 'SET_CONTENT_SAVING';
export const SET_CONTENT_SAVING_ERROR = 'SET_CONTENT_SAVING_ERROR';
export const SET_SEARCH_QUERY = 'SET_SEARCH_QUERY';
export const SET_SEARCH_RESULT = 'SET_SEARCH_RESULT';
export const ADD_SEARCH_RESULT = 'ADD_SEARCH_RESULT';
export const SET_SEARCH_RUNNING = 'SET_SEARCH_RUNNING';
export const SET_SEARCH_ERROR = 'SET_SEARCH_ERROR';

export const setEditorConfig = (editorConfig: EditorConfig) => ({ type: SET_EDITOR_CONFIG, editorConfig });

export const setEditorMode = (editorMode: EditorMode) => ({ type: SET_EDITOR_MODE, editorMode });

export const setEditorTab = (editorTab: EditorTab) => ({ type: SET_EDITOR_TAB, editorTab });

export const setContentId = (contentId: string | undefined) => ({ type: SET_CONTENT_ID, contentId });
export const setI18NContent = (i18nContent: Record<string, any>) => ({ type: SET_I18N_CONTENT, i18nContent });
export const setContentMarkdown = (lang: string, contentProp: string, contentMarkdown: string) => ({ type: SET_CONTENT_MARKDOWN, lang, contentProp, contentMarkdown });
export const setContentTitle = (lang: string, titleProp: string, contentTitle: string) => ({ type: SET_CONTENT_TITLE, lang, titleProp, contentTitle });
export const setStyle = (style: string) => ({ type: SET_STYLE, style });
export const setBelowFold = (belowFold: boolean) => ({ type: SET_BELOW_FOLD, belowFold });
export const setFullscreenImageOnClick = (fullscreenImageOnClick: boolean) => ({ type: SET_FULLSCREEN_IMAGE_ON_CLICK, fullscreenImageOnClick });
export const setSelectedLanguage = (lang: string) => ({ type: SET_SELECTED_LANGUAGE, lang });
export const addLanguage = (lang: string) => ({ type: ADD_LANGUAGE, lang });
export const removeLanguage = (lang: string) => ({ type: REMOVE_LANGUAGE, lang });
export const setDefaultLanguage = (lang: string) => ({ type: SET_DEFAULT_LANGUAGE, lang });
export const setPossibleLanguages = (languages: Array<string>) => ({ type: SET_POSSIBLE_LANGUAGES, languages });
export const setExistingTranslations = (languages: Array<string>) => ({ type: SET_EXISTING_TRANSLATIONS, languages });
export const addRemovedLanguage = (lang: string) => ({ type: ADD_REMOVED_LANGUAGE, lang });
export const setContentLoading = (loading: boolean) => ({ type: SET_CONTENT_LOADING, loading });
export const setContentLoadingError = (error: boolean) => ({ type: SET_CONTENT_LOADING_ERROR, error });
export const setContentSaving = (saving: boolean) => ({ type: SET_CONTENT_SAVING, saving });
export const setContentSavingError = (error: boolean) => ({ type: SET_CONTENT_SAVING_ERROR, error });

export const setSearchQuery = (query: string) => ({ type: SET_SEARCH_QUERY, query });
export const setSearchResult = (result: MashroomContentApiContentSearchResult<any> | undefined) => ({ type: SET_SEARCH_RESULT, result });
export const addSearchResult = (hits: Array<MashroomContentApiContentWrapper<any>>) => ({ type: ADD_SEARCH_RESULT, hits });
export const setSearchRunning = (running: boolean) => ({ type: SET_SEARCH_RUNNING, running });
export const setSearchError = (error: boolean) => ({ type: SET_SEARCH_ERROR, error });

export const loadContent = (contentId: string, lang: string, contentService: MashroomContentClientService) => (dispatch: EditorDispatch, getState: () => EditorState) => {
    const {config: {contentType, contentProp, titleProp}} = getState();

    dispatch(setContentLoading(true));
    dispatch(setContentLoadingError(false));
    contentService.getContent<any>(contentType, contentId, lang).then(
        ({meta, data}) => {
            dispatch(setContentMarkdown(lang, contentProp, data[contentProp]));
            dispatch(setContentTitle(lang, titleProp, data[titleProp]));
            dispatch(setExistingTranslations(meta.availableLocales || []));
            dispatch(setContentLoading(false));
        }
    ).catch((error) => {
        console.error('Error loading content', error);
        dispatch(setContentLoading(false));
        dispatch(setContentLoadingError(true));
    });
};

export const saveContent = (contentService: MashroomContentClientService) => (dispatch: EditorDispatch, getState: () => EditorState): Promise<string> => {
    const {config: {contentType}, content: {contentId, i18nContent, defaultLanguage, existingTranslations, removedLanguages}} = getState();

    dispatch(setContentSaving(true));
    dispatch(setContentSavingError(false));

    if (contentId) {
        let lastPromise: Promise<any> = Promise.resolve();

        // Save all languages
        Object.keys(i18nContent).forEach((lang) => {
            const content = i18nContent[lang];
            console.info(`Saving content for language ${lang}:`, content);
            lastPromise = lastPromise.then(() => contentService.updateContent<any>(contentType, contentId, {
                data: content,
                meta: {
                    locale: lang,
                }
            }));
        });

        // Delete removed languages
        const translationsWithNoContent = existingTranslations?.filter((lang) => !i18nContent[lang]);
        const deletedLanguages = removedLanguages.filter((lang) => translationsWithNoContent?.indexOf(lang) !== -1);
        if (deletedLanguages?.length) {
            console.info('Deleting languages:', deletedLanguages);
            lastPromise = lastPromise.then(() => contentService.removeContentParts(contentType, contentId, deletedLanguages));
        }

        return lastPromise
            .then(() => {
                dispatch(setContentSaving(false));
                return contentId;
            })
            .catch((e) => {
                dispatch(setContentSaving(false));
                dispatch(setContentSavingError(true))
                throw e;
            });
    } else if (defaultLanguage && i18nContent[defaultLanguage]) {
        // Create new content
        const content = i18nContent[defaultLanguage];
        console.info(`Creating new content:`, content);
        return contentService.insertContent<any>(contentType, {
            data: content,
            meta: {
                locale: defaultLanguage,
            }
        }).then(({id: contentId}) => {
            // Save other languages
            let lastPromise: Promise<any> = Promise.resolve();
            Object.keys(i18nContent).forEach((lang) => {
                if (lang !== defaultLanguage) {
                    const content = i18nContent[lang];
                    console.info(`Saving content for language ${lang}:`, content);
                    lastPromise = lastPromise.then(() => contentService.updateContent<any>(contentType, contentId, {
                        data: content,
                        meta: {
                            locale: lang,
                        }
                    }));
                }
            });

            return lastPromise
                .then(() => {
                    dispatch(setContentSaving(false));
                    return contentId;
                })
                .catch((e) => {
                    dispatch(setContentSaving(false));
                    dispatch(setContentSavingError(true))
                    throw e;
                });
        }).catch((e) => {
            dispatch(setContentSaving(false));
            dispatch(setContentSavingError(true))
            throw e;
        });
    }

    return Promise.reject('Cannot save content: Invalid arguments');
};

export const searchContent = (contentService: MashroomContentClientService, limit?: number, skip?: number) => (dispatch: EditorDispatch, getState: () => EditorState) => {
    const {config: {contentType, contentProp, titleProp}, search: {query}} = getState();

    let filter = undefined;
    if (query) {
        filter = {
            $or: [
                { [contentProp]: { $containsi: query } },
                { [titleProp]:  { $containsi: query } },
            ]
        };
    }

    dispatch(setSearchRunning(true));
    contentService.searchContent<any>(contentType, filter, undefined, undefined, undefined, limit, skip).then(
        (result) => {
            if (!skip) {
                dispatch(setSearchResult(result));
            } else {
                dispatch(addSearchResult(result.hits));
            }
            dispatch(setSearchRunning(false));
        }
    ).catch((error) => {
        console.error('Error searching content', error);
        dispatch(setSearchRunning(false));
        dispatch(setSearchError(true));
    });
};

export const loadSearchHit = (contentId: string) => (dispatch: EditorDispatch, getState: () => EditorState) => {
    newContent()(dispatch, getState);
    dispatch(setI18NContent({}));
    dispatch(setContentId(contentId));
};

export const newContent = () => (dispatch: EditorDispatch, getState: () => EditorState) => {
    const {content: {defaultLanguage = 'en'}} = getState();
    dispatch(setContentId(undefined));
    dispatch(setStyle(''));
    dispatch(setBelowFold(false));
    dispatch(setFullscreenImageOnClick(true));
    dispatch(setEditorMode('edit'));
    dispatch(setEditorTab('content'));
    dispatch(setExistingTranslations([]));
    dispatch(setI18NContent({}));
    dispatch(addLanguage(defaultLanguage));
    dispatch(setSelectedLanguage(defaultLanguage));
};

export const cloneContent = () => (dispatch: EditorDispatch) => {
    // All we have to do is to remove the id
    dispatch(setContentId(undefined));
    dispatch(setEditorMode('edit'));
    dispatch(setEditorTab('content'));
};

export const removeEditorLanguage = (lang: string) => (dispatch: EditorDispatch, getState: () => EditorState) => {
    const {content: {defaultLanguage = 'en'}} = getState();
    dispatch(setSelectedLanguage(defaultLanguage));
    dispatch(setEditorTab('content'));
    dispatch(removeLanguage(lang));
    dispatch(addRemovedLanguage(lang));
};

