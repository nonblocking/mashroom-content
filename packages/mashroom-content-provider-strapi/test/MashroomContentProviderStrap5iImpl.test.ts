import {Readable} from 'stream';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import nock from 'nock';
import MashroomContentProviderStrapi5Impl from '../src/MashroomContentProviderStrapi5Impl';

describe('MashroomContentProviderStrapiImpl', () => {

    it('searches entries', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content?filters[foo][$notContainsi]=test&filters[bar][$contains]=xxx&filters[age][$lt]=90&locale=de&sort[0]=foo:asc&pagination[limit]=100&pagination[start]=0')
            .reply(200, {
                data: [
                    {
                        id: 1,
                        title: 'Test',
                        content: 'This is a test entry with some **formatted** text and a image 2:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nAnd some other stuff:\n\n- One\n- Two\n\nDone.\n',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-11-06T15:47:29.706Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en',
                        documentId: 'lgubkouy0fkge5hmjbu9eya3'
                    },
                    {
                        id: 3,
                        title: 'test',
                        content: 'sdfsdfsdf',
                        createdAt: '2022-12-27T14:37:20.885Z',
                        updatedAt: '2023-07-28T07:55:32.219Z',
                        locale: 'en',
                        documentId: 'lkmy3wp0m1slk4t8bsaa2gyx'
                    }
                ],
                meta: {
                    pagination: {
                        start: 0,
                        limit: 2,
                        total: 2
                    }
                }
            });

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const filter = {
            foo: {
                $notContainsi: 'test',
            },
            bar: {
                $contains: 'xxx'
            },
            age: {
                $lt: 90
            }
        };
        const results = await contentProvider.searchContent(req, 'my-content', filter, 'de', undefined, {foo: 'asc'}, 100, 0);

        expect(results).toBeTruthy();
        expect(results.meta.total).toBe(2);
        expect(results.hits).toEqual([
            {
                id: 'lgubkouy0fkge5hmjbu9eya3',
                data: {
                    title: 'Test',
                    content: 'This is a test entry with some **formatted** text and a image 2:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nAnd some other stuff:\n\n- One\n- Two\n\nDone.\n',
                },
                meta: {
                    locale: 'en',
                    status: 'published',
                    createdAt: '2022-03-26T08:54:12.786Z',
                    updatedAt: '2022-11-06T15:47:29.706Z',
                    availableLocales: ['en'],
                }
            },
            {
                id: 'lkmy3wp0m1slk4t8bsaa2gyx',
                data: {
                    title: 'test',
                    content: 'sdfsdfsdf',
                },
                meta: {
                    locale: 'en',
                    status: 'draft',
                    createdAt: '2022-12-27T14:37:20.885Z',
                    updatedAt: '2023-07-28T07:55:32.219Z',
                    availableLocales: ['en'],
                }
            }
        ]);
    });

    it('finds a specific entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/lgubkouy0fkge5hmjbu9eya3?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    title: 'Test',
                    content: 'This is a test entry with some **formatted** text and a image 2:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nAnd some other stuff:\n\n- One\n- Two\n\nDone.\n',
                    createdAt: '2022-03-26T08:54:12.786Z',
                    updatedAt: '2022-11-06T15:47:29.706Z',
                    publishedAt: '2022-03-26T08:55:53.217Z',
                    locale: 'en',
                    documentId: 'lgubkouy0fkge5hmjbu9eya3',
                    localizations: [
                        {
                            id: 2,
                            title: 'Test',
                            content: 'Das ist ein Test Eintrag mit **formatiertem** Text und einem Bild:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nUnd anderem Zeug:\n\n- Eins\n- Zwei\n\nFertig.\n',
                            createdAt: '2022-03-26T08:55:30.220Z',
                            updatedAt: '2022-03-26T08:56:07.103Z',
                            publishedAt: '2022-03-26T08:56:07.102Z',
                            locale: 'de',
                            documentId: 'lgubkouy0fkge5hmjbu9eya3'
                        }
                    ]
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const entry = await contentProvider.getContent(req, 'my-content', 'lgubkouy0fkge5hmjbu9eya3', 'de', undefined);

        expect(entry).toBeTruthy();
        expect(entry).toEqual({
            id: 'lgubkouy0fkge5hmjbu9eya3',
            data: {
                title: 'Test',
                content: 'Das ist ein Test Eintrag mit **formatiertem** Text und einem Bild:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nUnd anderem Zeug:\n\n- Eins\n- Zwei\n\nFertig.\n',
            },
            meta: {
                locale: 'de',
                status: 'published',
                createdAt: '2022-03-26T08:55:30.220Z',
                updatedAt: '2022-03-26T08:56:07.103Z',
                availableLocales: ['en', 'de'],
            }
        });
    });

    it('inserts an entry correctly', async () => {
        nock('http://localhost:1337')
            .post('/api/my-content')
            .reply(200, {
                data: {
                    id: 12,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T09:52:59.522Z',
                    updatedAt: '2025-01-15T09:52:59.522Z',
                    publishedAt: '2025-01-15T09:52:59.525Z',
                    locale: 'en',
                    documentId: 'uhh8carv085nb91gdpg21tjg'
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.insertContent(req, 'my-content', {
            data: {
                title: 'The title',
                content: 'Some **markdown**',
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: 'uhh8carv085nb91gdpg21tjg',
            data: {
                title: 'The title',
                content: 'Some **markdown**',
            },
            meta: {
                availableLocales: [
                    'en'
                ],
                locale: 'en',
                createdAt: '2025-01-15T09:52:59.522Z',
                updatedAt: '2025-01-15T09:52:59.522Z',
                status: 'published'
            }
        });
    });

    it('Updates an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/uhh8carv085nb91gdpg21tjg?populate=localizations')
            .reply(200, {
                data: {
                    id: 13,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T09:52:59.522Z',
                    updatedAt: '2025-01-15T09:54:42.020Z',
                    publishedAt: '2025-01-15T09:54:42.022Z',
                    locale: 'en',
                    documentId: 'uhh8carv085nb91gdpg21tjg',
                    localizations: []
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .put('/api/my-content/uhh8carv085nb91gdpg21tjg')
            .reply(200, {
                data: {
                    id: 13,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T09:52:59.522Z',
                    updatedAt: '2025-01-15T09:54:42.020Z',
                    publishedAt: '2025-01-15T09:54:42.022Z',
                    locale: 'en',
                    documentId: 'uhh8carv085nb91gdpg21tjg'
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.updateContent(req, 'my-content', 'uhh8carv085nb91gdpg21tjg', {
            data: {
                title: 'The title',
                content: 'Some **markdown**',
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: 'uhh8carv085nb91gdpg21tjg',
            data: {
                title: 'The title',
                content: 'Some **markdown**',
            },
            meta: {
                availableLocales: [
                    'en'
                ],
                locale: 'en',
                createdAt: '2025-01-15T09:52:59.522Z',
                updatedAt: '2025-01-15T09:54:42.020Z',
                status: 'published'
            }
        });
    });

    it('Adds a new localization to an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1uhh8carv085nb91gdpg21tjg?populate=localizations')
            .reply(200, {
                data: {
                    id: 13,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T09:52:59.522Z',
                    updatedAt: '2025-01-15T09:54:42.020Z',
                    publishedAt: '2025-01-15T09:54:42.022Z',
                    locale: 'en',
                    documentId: '1uhh8carv085nb91gdpg21tjg',
                    localizations: []
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .put('/api/my-content/1uhh8carv085nb91gdpg21tjg?locale=de')
            .reply(200, {
                data: {
                    id: 17,
                    title: 'Der Titel',
                    content: 'Etwas **markdown**',
                    createdAt: '2025-01-15T09:59:07.202Z',
                    updatedAt: '2025-01-15T09:59:32.756Z',
                    publishedAt: '2025-01-15T09:59:32.758Z',
                    locale: 'de',
                    documentId: '1uhh8carv085nb91gdpg21tjg'
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.updateContent(req, 'my-content', '1uhh8carv085nb91gdpg21tjg', {
            data: {
                title: 'Der Titel',
                content: 'Etwas **markdown**',
            },
            meta: {
                locale: 'de',
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '1uhh8carv085nb91gdpg21tjg',
            data: {
                title: 'Der Titel',
                content: 'Etwas **markdown**',
            },
            meta: {
                availableLocales: [
                    'en', 'de',
                ],
                locale: 'de',
                createdAt: '2025-01-15T09:59:07.202Z',
                updatedAt: '2025-01-15T09:59:32.756Z',
                status: 'published'
            }
        });
    });

    it('Removes an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/uhh8carv085nb91gdpg21tjg?populate=localizations')
            .reply(200, {
                data: {
                    id: 13,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T09:52:59.522Z',
                    updatedAt: '2025-01-15T09:54:42.020Z',
                    publishedAt: '2025-01-15T09:54:42.022Z',
                    locale: 'en',
                    documentId: 'uhh8carv085nb91gdpg21tjg',
                    localizations: []
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .delete('/api/my-content/uhh8carv085nb91gdpg21tjg')
            .reply(204);

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeContent(req, 'my-content', 'uhh8carv085nb91gdpg21tjg');
    });

    it('Removes a locale from an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/zi0o2onrc2wapiedfo35jnj8?populate=localizations')
            .reply(200, {
                data: {
                    id: 19,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T10:05:17.640Z',
                    updatedAt: '2025-01-15T10:05:17.640Z',
                    publishedAt: '2025-01-15T10:05:17.641Z',
                    locale: 'en',
                    documentId: 'zi0o2onrc2wapiedfo35jnj8',
                    localizations: [
                        {
                            id: 21,
                            title: 'Der Titel',
                            content: 'Etwas **markdown**',
                            createdAt: '2025-01-15T10:05:36.027Z',
                            updatedAt: '2025-01-15T10:05:36.027Z',
                            publishedAt: '2025-01-15T10:05:36.029Z',
                            locale: 'de',
                            documentId: 'zi0o2onrc2wapiedfo35jnj8'
                        }
                    ]
                },
                meta: {}
            });
        nock('http://localhost:1337')
            .get('/api/my-content/zi0o2onrc2wapiedfo35jnj8?populate=localizations')
            .reply(200, {
                data: {
                    id: 19,
                    title: 'The title',
                    content: 'Some **markdown**',
                    createdAt: '2025-01-15T10:05:17.640Z',
                    updatedAt: '2025-01-15T10:05:17.640Z',
                    publishedAt: '2025-01-15T10:05:17.641Z',
                    locale: 'en',
                    documentId: 'zi0o2onrc2wapiedfo35jnj8',
                    localizations: []
                },
                meta: {}
            });
        nock('http://localhost:1337')
            .delete('/api/my-content/zi0o2onrc2wapiedfo35jnj8?locale=de')
            .reply(204);

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeContentParts(req, 'my-content', 'zi0o2onrc2wapiedfo35jnj8', ['de']);
    });

    it('stores assets in the asset folder', async () => {
        nock('http://localhost:1337')
            .post('/api/upload', /test content/)
            .reply(201, [{
                id: 3,
                name: 'logo.png',
                alternativeText: null,
                caption: null,
                width: 1000,
                height: 250,
                formats: {
                    thumbnail: {
                        name: 'thumbnail_logo.png',
                        hash: 'thumbnail_logo_1ae1b8195b',
                        ext: '.png',
                        mime: 'image/png',
                        path: null,
                        width: 245,
                        height: 61,
                        size: 5.29,
                        sizeInBytes: 5288,
                        url: '/uploads/thumbnail_logo_1ae1b8195b.png'
                    }
                },
                hash: 'logo_1ae1b8195b',
                ext: '.png',
                mime: 'image/png',
                size: 15.01,
                url: '/uploads/logo_1ae1b8195b.png',
                previewUrl: null,
                provider: 'local',
                provider_metadata: null,
                createdAt: '2025-01-15T10:08:22.883Z',
                updatedAt: '2025-01-15T10:08:22.883Z',
                documentId: 'm9k5hdmh7lqe3v6nrkfgiy81',
                publishedAt: '2025-01-15T10:08:22.883Z'
            }]);

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const file = new Readable();
        file.push('test content');
        file.push(null);

        const meta = {
            fileName: 'logo.png',
            title: 'logo.png',
            mimeType: 'image/png',
        };

        const result = await contentProvider.uploadAsset(req, file, meta);

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: 3,
            meta: {
                fileName: 'logo.png',
                height: 250,
                mimeType: 'image/png',
                size: 15.01,
                title: null,
                width: 1000
            },
            url: '/uploads/logo_1ae1b8195b.png'
        });
    });

    it('searches assets', async () => {
        nock('http://localhost:1337')
            .get('/api/upload/files?filters[mime][$containsi]=image&filters[caption][$containsi]=screenshot&sort[0]=createdAt:desc')
            .reply(200, [
                {
                    id: 2,
                    name: 'mashroom_portal_ui.png',
                    alternativeText: 'mashroom_portal_ui.png',
                    caption: 'mashroom_portal_ui.png',
                    width: 1357,
                    height: 972,
                    formats: {
                        thumbnail: {
                            name: 'thumbnail_mashroom_portal_ui.png',
                            hash: 'thumbnail_mashroom_portal_ui_efd1816ec4',
                            ext: '.png',
                            mime: 'image/png',
                            path: null,
                            width: 218,
                            height: 156,
                            size: 26.1,
                            url: '/uploads/thumbnail_mashroom_portal_ui_efd1816ec4.png'
                        }
                    },
                    hash: 'mashroom_portal_ui_efd1816ec4',
                    ext: '.png',
                    mime: 'image/png',
                    size: 591.99,
                    url: '/uploads/mashroom_portal_ui_efd1816ec4.png',
                    previewUrl: null,
                    provider: 'local',
                    provider_metadata: null,
                    createdAt: '2022-03-26T08:46:01.864Z',
                    updatedAt: '2022-03-26T08:46:01.864Z',
                    documentId: 'hm4m2wvjzwa3cwi2aatwlwcj',
                    publishedAt: '2025-01-08T08:03:31.073Z'
                },
                {
                    id: 1,
                    name: 'mashroom_monitoring.png',
                    alternativeText: 'mashroom_monitoring.png',
                    caption: 'mashroom_monitoring.png',
                    width: 1434,
                    height: 939,
                    formats: {
                        thumbnail: {
                            name: 'thumbnail_mashroom_monitoring.png',
                            hash: 'thumbnail_mashroom_monitoring_3ee1a48575',
                            ext: '.png',
                            mime: 'image/png',
                            path: null,
                            width: 238,
                            height: 156,
                            size: 29.61,
                            url: '/uploads/thumbnail_mashroom_monitoring_3ee1a48575.png'
                        }
                    },
                    hash: 'mashroom_monitoring_3ee1a48575',
                    ext: '.png',
                    mime: 'image/png',
                    size: 202.21,
                    url: '/uploads/mashroom_monitoring_3ee1a48575.png',
                    previewUrl: null,
                    provider: 'local',
                    provider_metadata: null,
                    createdAt: '2022-03-26T08:46:01.857Z',
                    updatedAt: '2022-03-26T08:46:01.857Z',
                    documentId: 'akzn1803eh8psjarxa306h9f',
                    publishedAt: '2025-01-08T08:03:31.073Z'
                }
            ]);

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const results = await contentProvider.searchAssets(req, 'image', 'screenshot', 100, 0);

        expect(results).toBeTruthy();
        expect(results.meta.total).toBe(2);
        expect(results.hits).toEqual([
            {
                id: 2,
                meta: {
                    fileName: 'mashroom_portal_ui.png',
                    height: 972,
                    mimeType: 'image/png',
                    size: 591.99,
                    title: 'mashroom_portal_ui.png',
                    width: 1357
                },
                url: '/uploads/mashroom_portal_ui_efd1816ec4.png'
            },
            {
                id: 1,
                meta: {
                    fileName: 'mashroom_monitoring.png',
                    height: 939,
                    mimeType: 'image/png',
                    size: 202.21,
                    title: 'mashroom_monitoring.png',
                    width: 1434
                },
                url: '/uploads/mashroom_monitoring_3ee1a48575.png'
            }
        ]);
    });

    it('removes assets', async () => {
        nock('http://localhost:1337')
            .delete('/api/upload/files/5')
            .reply(200);

        const contentProvider = new MashroomContentProviderStrapi5Impl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeAsset(req, '5');
    });

});
