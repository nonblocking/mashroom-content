import type {MashroomContentAsset} from '@mashroom-content/mashroom-content-api/type-definitions';

export type ContentStatus = 'published' | 'draft' | 'historic';

export type ContentMasterEntry = {
    readonly _contentId: string;
    readonly _contentCreated: number;
    readonly _contentUpdated: number;
    readonly _contentType: string;
    readonly _contentLanguages: Array<string>;
}

export type ContentEntry<T> = T & {
    readonly _contentId: string;
    readonly _contentCreated: number;
    readonly _contentUpdated: number;
    readonly _contentType: string;
    readonly _contentVersion: number;
    readonly _contentAvailableLanguages: Array<string>;
    readonly _contentStatus: ContentStatus;
}

export type AssetEntry = MashroomContentAsset & {
    readonly _assetId: string;
    readonly _assetCreated: number;
}
