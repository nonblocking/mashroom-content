
import {tmpdir} from 'os';
import {createServer} from 'http';
import express from 'express';
import {dummyLoggerFactory as loggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import routes from './routes';
import type {
    MashroomContentAssetSearchResult,
    MashroomContentApiContentUpdateInsert,
    MashroomContentApiFilter,
    MashroomContentApiSort,
    MashroomContentApiStatus,
    MashroomContentAssetContentRef,
    MashroomContentAsset,
    MashroomContentService,
    MashroomContentAssetMeta,
} from '../../../type-definitions';
import type {Readable} from 'stream';

import type {Request} from 'express';

const tmpUploadDir = `${tmpdir()}/mashroom-content/dev-server/upload`;

// Dummy content service
const contentService: MashroomContentService = {
    imageBreakpoints: [],
    imagePreferredFormats: [],
    async getContent(req: Request, type: string, id: string, locale?: string) {
        const data: any = {
            type,
            message: 'test',
        };
        return {
            id,
            data,
            meta: {
                version: '1',
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                locale,
            }
        };
    },
    async getContentVersions(req: Request, type: string, id: string) {
      return {
          versions: [
              (await this.getContent(req, type, id))!,
          ]
      };
    },
    async insertContent<T>(req: Request, type: string, content: MashroomContentApiContentUpdateInsert<T>) {
        return {
            id: '2',
            data: {
                ...content.data,
            },
            meta: {
                ...content.meta,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        };
    },
    async removeContent(req: Request, type: string, id: string): Promise<void> {
        return;
    },
    async removeContentParts(req: Request, type: string, id: string, locales?: Array<string>, versions?: Array<number>): Promise<void> {
        return;
    },
    async searchContent<T>(req: Request, type: string, filter?: MashroomContentApiFilter<T>, locale?: string, status?: MashroomContentApiStatus,
                           sort?: MashroomContentApiSort<T>, limit?: number, skip?: number) {
        const data1: any = {
            id: '1',
            type,
            message: 'test',
        };
        const data2: any = {
            id: '2',
            type,
            message: 'test2',
        };
        return {
            hits: [data1, data2],
            meta: {
                total: 2,
            }
        };
    },
    async updateContent<T>(req: Request, type: string, id: string, content: MashroomContentApiContentUpdateInsert<Partial<T>>) {
        const existingData: any = {};
        return {
            id,
            data: {
                ...content.data,
                ...existingData,
            },
            meta: {
                ...content.meta,
                status: 'draft',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        };
    },
    async uploadAsset(req: Request, file: Readable, meta: MashroomContentAssetMeta, path?: string, contentRef?: MashroomContentAssetContentRef): Promise<MashroomContentAsset> {
        return {
            id: '1',
            url: '/assets/123123213/my_image.png',
            meta: {
                title: 'My Image',
                fileName: 'my_image.png',
                mimeType: 'image/png'
            }
        };
    },
    async searchAssets(req: Request, type: string, titleContains?: string, limit?: number, skip?: number): Promise<MashroomContentAssetSearchResult> {
        return {
            hits: [{
                id: '1',
                url: '/assets/123123213/my_image.png',
                meta: {
                    title: 'My Image',
                    fileName: 'my_image.png',
                    mimeType: 'image/png'
                }
            }],
            meta: {
                total: 1,
            }
        };
    },
    async removeAsset(req: Request, id: string): Promise<void> {
        // Nothing to do
    }
};

// Dummy context
const pluginContext: any = {
    loggerFactory,
    services: {
        core: {

        },
        content: {
            service: contentService,
        }
    }
};

const wrapperApp = express();
const httpServer = createServer(wrapperApp);

wrapperApp.use((req, res, next) => {
    req.pluginContext = pluginContext;
    next();
});

wrapperApp.use('/content', routes(tmpUploadDir));

httpServer.listen(6776, () => {
    console.log('Dev server started: http://localhost:6776');
});
httpServer.once('error', (error) => {
    console.error('Failed to start server!', error);
});

