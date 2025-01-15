
export type StrapiContent<T> = T &{
    readonly id: number;
    readonly documentId: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly publishedAt: string;
    readonly locale?: string;
    readonly localizations?: Array<StrapiContent<T>>;
}

export type StrapiContentSearchResult<T> = {
    readonly data: Array<StrapiContent<T>>;
    readonly meta: {
        readonly pagination: {
            readonly page: number;
            readonly pageSize: number;
            readonly pageCount: number;
            readonly total: number;
        }
    }
}

export type StrapiContentWrapper<T> = {
    readonly data: StrapiContent<T>;
}

export type StrapiContentInsert<T> = {
    readonly data: T;
}

export type StrapiContentUpdate<T> = {
    readonly data: Partial<T>;
}

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

// Strapi 4 stuff

export type Strapi4ContentLocalizations<T> = {
    readonly data: Array<Strapi4Content<T>>;
}

export type Strapi4Content<T> = {
    readonly id: number;
    readonly attributes: T & {
        readonly createdAt: string;
        readonly updatedAt: string;
        readonly publishedAt: string;
        readonly locale?: string;
        readonly localizations?: Strapi4ContentLocalizations<any>;
    }
}

export type Strapi4ContentWrapper<T> = {
   readonly data: Strapi4Content<T>;
}

export type Strapi4ContentSearchResult<T> = {
    readonly data: Array<Strapi4Content<T>>;
    readonly meta: {
        readonly pagination: {
            readonly page: number;
            readonly pageSize: number;
            readonly pageCount: number;
            readonly total: number;
        }
    }
}

export type Strapi4ContentInsert<T> = {
    readonly data: T & {
        readonly locale?: string;
    }
}

export type Strapi4ContentInsertLocalization<T> = T & {
    readonly locale: string;
}

export type Strapi4ContentInsertLocalizationResult<T> = T & {
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly publishedAt: string;
    readonly locale: string;
    readonly localizations: Array<T & {
        readonly id: string;
        readonly createdAt: string;
        readonly updatedAt: string;
        readonly publishedAt: string;
        readonly locale: string;
    }>
}



