import PromiseWithProgressAndCancelDeferred from './PromiseWithProgressAndCancelDeferred';

import type {
    MashroomContentApiContentSearchResult,
    MashroomContentApiContentUpdateInsert,
    MashroomContentApiContentWrapper,
    MashroomContentApiFilter,
    MashroomContentApiSort,
    MashroomContentApiStatus,
    MashroomContentAssetContentRef,
    MashroomContentAsset,
    MashroomContentClientService,
    MashroomContentVersionsResult,
    MashroomContentAssetSearchResult,
    PromiseWithProgressAndCancel,
} from '../../../type-definitions';
import type {components} from '../../../type-definitions/rest-api';

const CSRF_TOKEN_META = document.querySelector('meta[name="csrf-token"]');
const CSRF_TOKEN = CSRF_TOKEN_META && CSRF_TOKEN_META.getAttribute('content');

class MashroomContentClientServiceImpl implements MashroomContentClientService {

    #apiBasePath: string;

    constructor() {
        this.#apiBasePath = (global as any).MASHROOM_CONTENT_API_BASE_PATH || '/content';
    }

    get imageBreakpoints() {
        return (global as any).MASHROOM_CONTENT_API_IMAGE_BREAKPOINTS || [];
    }

    get imagePreferredFormats() {
        return (global as any).MASHROOM_CONTENT_API_IMAGE_PREFERRED_FORMATS || [];
    }

    async searchContent<T>(type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus, sort?: MashroomContentApiSort<T>, limit?: number, skip?: number): Promise<MashroomContentApiContentSearchResult<T>> {
        const searchRequest: components['schemas']['ContentSearchRequest'] = {
            filter,
            locale,
            status,
            sort,
            limit,
            skip
        };
        const response = await fetch(`${this.#apiBasePath}/api/${type}/searches`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
            },
            body: JSON.stringify(searchRequest),
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async getContent<T>(type: string, id: string, locale?: string, version?: number): Promise<MashroomContentApiContentWrapper<T>> {
        const query = [];
        if (locale) {
            query.push(`locale=${locale}`);
        }
        if (version) {
            query.push(`version=${version}`);
        }
        const response = await fetch(`${this.#apiBasePath}/api/${type}/${id}${this.joinQuery(query)}`, {
            credentials: 'same-origin',
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async getContentVersions<T>(type: string, id: string, locale?: string): Promise<MashroomContentVersionsResult<T>> {
        const query: Array<string> = [];
        if (locale) {
            query.push(`locale=${locale}`);
        }
        const response = await fetch(`${this.#apiBasePath}/api/${type}/versions${id}${this.joinQuery(query)}`, {
            credentials: 'same-origin',
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async insertContent<T>(type: string, content: MashroomContentApiContentUpdateInsert<T>): Promise<MashroomContentApiContentWrapper<T>> {
        const response = await fetch(`${this.#apiBasePath}/api/${type}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
            },
            body: JSON.stringify(content),
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async updateContent<T>(type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>): Promise<MashroomContentApiContentWrapper<T>> {
        const response = await fetch(`${this.#apiBasePath}/api/${type}/${id}`, {
            method: 'PUT',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
            },
            body: JSON.stringify(content),
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async removeContent(type: string, id: string): Promise<void> {
        const response = await fetch(`${this.#apiBasePath}/api/${type}/${id}}`, {
            credentials: 'same-origin',
            method: 'DELETE'
        });
        if (response.ok) {
            return;
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async removeContentParts(type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void> {
        if (!locales && !versions) {
            return;
        }
        const query: Array<string> = [];
        if (locales) {
            locales.forEach((locale) => query.push(`locale=${locale}`));
        }
        if (versions) {
            versions.forEach((version) => query.push(`version=${version}`));
        }
        const response = await fetch(`${this.#apiBasePath}/api/${type}/${id}${this.joinQuery(query)}`, {
            credentials: 'same-origin',
            method: 'DELETE'
        });
        if (response.ok) {
            return;
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    uploadAsset(file: File, path?: string, contentRef?: MashroomContentAssetContentRef): PromiseWithProgressAndCancel<MashroomContentAsset> {
        const formData = new FormData();
        formData.append('file', file);
        if (path) {
            formData.append('path', path);
        }
        if (contentRef) {
            formData.append('contentRefType', contentRef.type);
            formData.append('contentRefId', contentRef.id);
            formData.append('contentRefFieldName', contentRef.fieldName);
            if (contentRef.locale) {
                formData.append('contentRefLocale', contentRef.locale);
            }
        }

        const xhr = new global.XMLHttpRequest();

        const deferred = new PromiseWithProgressAndCancelDeferred<MashroomContentAsset>(() => xhr.abort());
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 300) {
                    let responseBody;
                    try {
                        responseBody = JSON.parse(xhr.responseText);
                    } catch (e) {
                        // No JSON
                        responseBody = xhr.responseText;
                    }
                    deferred.resolve(responseBody);
                } else if (xhr.status > 0) {
                    deferred.reject(new Error(`Request failed with status: ${xhr.status}`));
                } else {
                    // Status 0
                    deferred.reject(new Error('Aborted'));
                }
            }
        };
        xhr.upload.onprogress = event => {
            if (event.lengthComputable) {
                const progress = Math.round((event.loaded / event.total) * 100.0);
                deferred.notify({progress});
            }
        };
        xhr.upload.onabort = () => {
            deferred.reject(new Error('Aborted'));
        };
        try {
            xhr.open('POST', `${this.#apiBasePath}/assets`, /* async */ true);
            if (CSRF_TOKEN) {
                xhr.setRequestHeader('X-CSRF-Token', CSRF_TOKEN);
            }
            xhr.send(formData);
        } catch (error) {
            deferred.reject(error);
        }

        return deferred.getPromise();
    }

    async searchAssets(type: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult> {
        const query: Array<string> = [];
        if (type) {
            query.push(`type=${type}`);
        }
        if (titleContains) {
            query.push(`titleContains=${titleContains}`);
        }
        if (limit) {
            query.push(`limit=${limit}`);
        }
        if (skip) {
            query.push(`skip=${skip}`);
        }
        const response = await fetch(`${this.#apiBasePath}/assets${this.joinQuery(query)}`, {
            credentials: 'same-origin',
        });
        if (response.ok) {
            return response.json();
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    async removeAsset(id: string): Promise<void> {
        const response = await fetch(`${this.#apiBasePath}/assets/${id}`, {
            method: 'DELETE',
            credentials: 'same-origin',
            headers: {
                ...(CSRF_TOKEN ? { 'X-CSRF-Token': CSRF_TOKEN } : {}),
            }
        });
        if (response.ok) {
            return;
        }
        throw new Error(`Request failed with status code: ${response.status}`);
    }

    private joinQuery(parts: Array<string>) {
        if (parts.length === 0) {
            return '';
        }
        return `?${parts.join('&')}`;
    }
}

(global as any).MASHROOM_CONTENT_API_CLIENT_SERVICE = new MashroomContentClientServiceImpl();

