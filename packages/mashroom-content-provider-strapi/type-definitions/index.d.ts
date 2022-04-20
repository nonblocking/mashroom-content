
export type StrapiUpload = {
    id: string;
    name: string;
    caption: string;
    mime: string;
    url: string;
    size: number;
    width?: number;
    height?: number;
    createdAt: string;
    updatedAt: string;
}

export type StrapiUploads = Array<StrapiUpload>;

export type StrapiContentLocalizations<T> = {
    data: Array<StrapiContent<T>>;
}

export type StrapiContent<T> = {
    id: number;
    attributes: T & {
        createdAt: string;
        updatedAt: string;
        publishedAt: string;
        locale?: string;
        localizations?: StrapiContentLocalizations;
    }
}

export type StrapiContentWrapper<T> = {
   data: StrapiContent<T>;
   meta: any;
}

export type StrapiContentSearchResult<T> = {
    data: Array<StrapiContent<T>>;
    meta: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        }
    }
}

export type StrapiContentInsert<T> = {
    data: T & {
        locale?: string;
    }
}

export type StrapiContentInsertLocalization<T> = T & {
    locale: string;
}

export type StrapiContentInsertLocalizationResult<T> = T & {
    id: string;
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
    locale: string;
    localizations: Array<T & {
        id: string;
        createdAt: string;
        updatedAt: string;
        publishedAt: string;
        locale: string;
    }>
}

export type StrapiContentUpdate<T> = {
    data: Partial<T>;
}



