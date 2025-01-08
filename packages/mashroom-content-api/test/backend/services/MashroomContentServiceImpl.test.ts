import MashroomContentServiceImpl from '../../../src/backend/services/MashroomContentServiceImpl';

const searchContentMock = jest.fn();
const dummyProvider: any = {
    searchContent: searchContentMock,
};

const registry: any = {
    getContentProvider: () => dummyProvider,
};

describe('MashroomContentServiceImpl', () => {

    it('searches content and rewrite asset URLs', async () => {
        type WebContent = {
            tags: Array<string>;
            foo?: number;
            html: string;
        }

        const service = new MashroomContentServiceImpl('dummy', registry, false, 0, false);

        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                content: {
                    rewrite: {
                        rewriteContent: (req: any, content: any) => content.replace(/\/uploads/g, '/content/assets/p1'),
                    }
                }
            }
        };
        const req: any = {
            pluginContext,
        };
        searchContentMock.mockReturnValue(Promise.resolve({
            hits: [{ id: 'test', data: { html: '<img src="/uploads/foo.png></img>' } }],
            meta: { total: 1 },
        }));

        const result1 = await service.searchContent<WebContent>(req, 'web-content', {tags: {$in: ['foo']}}, undefined, 'published', { foo: 'desc' }, 100);
        const result2 = await service.searchContent<WebContent>(req, 'web-content', {$or: [{foo: {$exists: true}}, {html: {$containsi: 'test'}}]});

        expect(result1).toBeTruthy();
        expect(result1.hits[0]?.id).toBe('test');
        expect(result1.hits[0]?.data.html).toBe('<img src="/content/assets/p1/foo.png></img>');
        expect(result2).toBeTruthy();

        expect(searchContentMock.mock.calls.length).toBe(2);
    });

    it('rewrites URLs in nested content properties', async () => {
        type WebContent = {
            tags: Array<string>;
            whatever: any;
            html: string;
        }

        const service = new MashroomContentServiceImpl('dummy', registry, false, 0, false);

        const pluginContext: any = {
            loggerFactory: () => console,
            services: {
                content: {
                    rewrite: {
                        rewriteContent: (req: any, content: any) => content.replace(/\/uploads/g, '/content/assets/p1'),
                    }
                }
            }
        };
        const req: any = {
            pluginContext,
        };
        searchContentMock.mockReturnValue(Promise.resolve({
            hits: [{ id: 'test', data: { tags: ['/uploads/bar.png'], whatever: { x: { y: { z: '<a href="/uploads/foo.png">Click me</a>' }}}, html: '<img src="/uploads/foo.png></img>' } }],
            meta: { total: 1 },
        }));

        const result = await service.searchContent<WebContent>(req, 'web-content');

        expect(result).toBeTruthy();
        expect(result.hits[0]?.id).toBe('test');
        expect(result.hits[0]?.data).toEqual({
            html: '<img src="/content/assets/p1/foo.png></img>',
            tags: [
                '/content/assets/p1/bar.png'
            ],
            whatever: {
                x: {
                    y: {
                        z: '<a href="/content/assets/p1/foo.png">Click me</a>'
                    }
                }
            }
        });
    });

});
