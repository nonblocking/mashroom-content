
import type {Store as ReduxStore, AnyAction} from 'redux';
import type {ThunkActionDispatch} from 'redux-thunk';
import type {MashroomContentAssetSearchResult} from '@mashroom-content/mashroom-content-api/type-definitions';

export type Search = {
    readonly typeFilter: 'image' | 'video' | null;
    readonly query: string | null;
    readonly skip: number | undefined;
    readonly result: MashroomContentAssetSearchResult | undefined;
    readonly running: boolean;
    readonly error: boolean;
}

export type Upload = {
    readonly id: string;
    readonly file: File;
    readonly progress: number;
    readonly error: boolean;
}

export type Uploads = Array<Upload>;

export type Config = {
    readonly modalMode: boolean;
    readonly typeFilter: string | undefined | null;
    readonly responseChannelTopic: string;
}

export type State = {
    readonly config: Config;
    readonly search: Search;
    readonly uploads: Uploads;
}

export type Action = AnyAction;

export type Dispatch = ThunkActionDispatch<any>;

export type Store = ReduxStore<State, Action>;
