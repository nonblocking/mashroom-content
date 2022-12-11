
import type {Store as ReduxStore, AnyAction} from 'redux';
import type {ThunkActionDispatch} from 'redux-thunk';
import type {MashroomContentApiContentSearchResult,MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {MashroomPortalUserService} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomPortalAppService, MashroomPortalMessageBus} from '@mashroom/mashroom-portal/type-definitions/api';
import type {ReactCodeMirrorRef} from '@uiw/react-codemirror';

export type AppState = {
    readonly markdown: string | undefined;
    readonly error: boolean;
}

export type EditorConfig = {
    readonly contentType: string;
    readonly contentProp: string;
    readonly titleProp: string;
}

export type EditorContent = {
    readonly  contentId: string | undefined;
    readonly i18nContent: Record<string, any>;
    readonly existingTranslations: Array<string> | undefined;
    readonly defaultLanguage: string | undefined;
    readonly possibleLanguages: Array<string> | undefined;
    readonly removedLanguages: Array<string>;
    readonly selectedLanguage: string | undefined;
    readonly style: string | undefined | null;
    readonly belowFold: boolean;
    readonly fullscreenImageOnClick: boolean;
    readonly loading: boolean;
    readonly loadingError: boolean;
    readonly saving: boolean;
    readonly savingError: boolean;
}

export type EditorSearch = {
    readonly query: string;
    readonly result: MashroomContentApiContentSearchResult<any> | undefined;
    readonly running: boolean;
    readonly error: boolean;
}

export type EditorMode = 'edit' | 'search';
export type EditorTab = 'content' | 'style' | 'preview';

export type EditorState = {
    readonly config: EditorConfig;
    readonly mode: EditorMode;
    readonly tab: EditorTab;
    readonly content: EditorContent;
    readonly search: EditorSearch;
}

export type Action = AnyAction;

export type EditorDispatch = ThunkActionDispatch<any>;

export type EditorStore = ReduxStore<EditorState, Action>;

export type EditorContext = {
    appId: string;
    lang: string;
    contentService: MashroomContentClientService;
    portalUserService: MashroomPortalUserService;
    portalAppService: MashroomPortalAppService;
    messageBus: MashroomPortalMessageBus;
}

export type EditorCommand = (cm: ReactCodeMirrorRef) => void;
