import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging_utils';
import {Readable} from 'stream';
import nock from 'nock';
import MashroomContentProviderStrapiImpl from '../src/MashroomContentProviderStrapiImpl';

describe('MashroomContentProviderStrapiImpl', () => {

    it('searches entries', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content?filters[foo][$notContainsi]=test&filters[bar][$contains]=xxx&filters[age][$lt]=90&locale=de&sort[0]=foo:asc&pagination[limit]=100&pagination[start]=0')
            .reply(200, {
                data: [
                    {
                        id: 1,
                        attributes: {
                            title: 'Test',
                            content: 'This is a test entry with some **formatted** text and a image:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nAnd some other stuff:\n\n- One\n- Two\n\nDone.\n',
                            createdAt: '2022-03-26T08:54:12.786Z',
                            updatedAt: '2022-03-26T08:55:53.219Z',
                            publishedAt: '2022-03-26T08:55:53.217Z',
                            locale: 'en'
                        }
                    },
                    {
                        id: 3,
                        attributes: {
                            title: 'woohooo test',
                            content: 'test',
                            createdAt: '2022-04-06T13:02:15.002Z',
                            updatedAt: '2022-04-06T13:03:59.341Z',
                            publishedAt: null,
                            locale: 'en'
                        }
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

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

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
        const results = await contentProvider.searchContent(req, 'my-content', filter, 'de', undefined, { foo: 'asc' }, 100, 0);

        expect(results).toBeTruthy();
        expect(results.meta.total).toBe(2);
        expect(results.hits).toEqual([
            {
                id: '1',
                data: {
                    content: 'This is a test entry with some **formatted** text and a image:\n\n![mashroom_portal_ui.png](http://localhost:1337/uploads/mashroom_portal_ui_efd1816ec4.png)\n\nAnd some other stuff:\n\n- One\n- Two\n\nDone.\n',
                    title: 'Test'
                },
                meta: {
                    locale: 'en',
                    status: 'published',
                    availableLocales: ['en'],
                }
            },
            {
                id: '3',
                data: {
                    content: 'test',
                    title: 'woohooo test'
                },
                meta: {
                    locale: 'en',
                    status: 'draft',
                    availableLocales: ['en'],
                }
            }
        ]);
    });

    it('finds a specific entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1234?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        title: 'Test',
                        content: 'This is a test entry',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en',
                        localizations: {
                            data: [
                                {
                                    id: 2,
                                    attributes: {
                                        title: 'Test',
                                        content: 'Das ist ein Test Eintrag',
                                        createdAt: '2022-03-26T08:55:30.220Z',
                                        updatedAt: '2022-03-26T08:56:07.103Z',
                                        publishedAt: '2022-03-26T08:56:07.102Z',
                                        locale: 'de'
                                    }
                                }
                            ]
                        }
                    }
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const entry = await contentProvider.getContent(req, 'my-content', '1234', 'de', undefined);

        expect(entry).toBeTruthy();
        expect(entry).toEqual({
            id: '2',
            data: {
                content: 'Das ist ein Test Eintrag',
                title: 'Test'
            },
            meta: {
                locale: 'de',
                status: 'published',
                availableLocales: ['en', 'de'],
            }
        });
    });

    it('inserts an entry correctly', async () => {
        nock('http://localhost:1337')
            .post('/api/my-content')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        what: 'ever',
                        it: 'is',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en',
                    }
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.insertContent(req, 'my-content', {
            data: {
                what: 'ever',
                it: 'is'
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '1',
            data: {
                it: 'is',
                what: 'ever'
            },
            meta: {
                availableLocales: [
                    'en'
                ],
                locale: 'en',
                status: 'published'
            }
        });
    });

    it('Updates an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        it: 'is',
                        what: 'ever',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en'
                    }
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .put('/api/my-content/1')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        what: 'ever 2',
                        it: 'is 2',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en'
                    }
                },
                meta: {}
            });

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.updateContent(req, 'my-content', '1', {
            data: {
                what: 'ever 2',
                it: 'is 2'
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '1',
            data: {
                it: 'is 2',
                what: 'ever 2'
            },
            meta: {
                availableLocales: [
                    'en'
                ],
                locale: 'en',
                status: 'published'
            }
        });
    });

    it('Adds a new localization to an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        it: 'is',
                        what: 'ever',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en',
                    }
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .post('/api/my-content/1/localizations')
            .reply(200, {
                id: 2,
                what: 'immer',
                it: 'ist',
                locale: 'de',
                publishedAt: '2022-04-04',
                localizations: [
                    {
                        id: 1,
                        it: 'is',
                        what: 'ever',
                        locale: 'en'
                    }
                ]
            });

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const result = await contentProvider.updateContent(req, 'my-content', '1', {
            data: {
                what: 'immer',
                it: 'ist',
            },
            meta: {
                locale: 'de',
            }
        });

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '2',
            data: {
                what: 'immer',
                it: 'ist',
            },
            meta: {
                availableLocales: [
                    'de', 'en',
                ],
                locale: 'de',
                status: 'published'
            }
        });
    });

    it('Removes an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        it: 'is',
                        what: 'ever',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en'
                    }
                },
                meta: {}
            });

        nock('http://localhost:1337')
            .delete('/api/my-content/1')
            .reply(200);

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeContent(req, 'my-content', '1');
    });

    it('Removes a locale from an entry', async () => {
        nock('http://localhost:1337')
            .get('/api/my-content/1?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        it: 'is',
                        what: 'ever',
                        createdAt: '2022-03-26T08:54:12.786Z',
                        updatedAt: '2022-03-26T08:55:53.219Z',
                        publishedAt: '2022-03-26T08:55:53.217Z',
                        locale: 'en',
                        localizations: {
                            data: [
                                {
                                    id: 2,
                                    attributes: {
                                        title: 'Test',
                                        content: 'Das ist ein Test',
                                        createdAt: '2022-03-26T08:55:30.220Z',
                                        updatedAt: '2022-03-26T08:56:07.103Z',
                                        publishedAt: '2022-03-26T08:56:07.102Z',
                                        locale: 'de'
                                    }
                                }
                            ]
                        }
                    }
                },
                meta: {}
            });
        nock('http://localhost:1337')
            .get('/api/my-content/2?populate=localizations')
            .reply(200, {
                data: {
                    id: 1,
                    attributes: {
                        id: 2,
                        attributes: {
                            title: 'Test',
                            content: 'Das ist ein Test',
                            createdAt: '2022-03-26T08:55:30.220Z',
                            updatedAt: '2022-03-26T08:56:07.103Z',
                            publishedAt: '2022-03-26T08:56:07.102Z',
                            locale: 'de'
                        }
                    }
                },
                meta: {}
            });
        nock('http://localhost:1337')
            .delete('/api/my-content/2')
            .reply(200);

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeContentParts(req, 'my-content', '1', ['de']);
    });

    it('stores assets in the asset folder', async () => {
        nock('http://localhost:1337')
            .post('/api/upload', /test content/)
            .reply(200, [{
                id: '123ABC',
                caption: 'test.txt',
                name: 'test.txt',
                url: '/uploads/test.txt',
                size: 10,
                height: 100,
                width: 200,
            }]);

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const file = new Readable();
        file.push('test content');
        file.push(null);

        const meta = {
            title: 'test.txt',
            fileName: 'test.txt',
            mimeType: 'text/plain',
        };

        const result = await contentProvider.uploadAsset(req, file, meta);

        expect(result).toBeTruthy();
        expect(result).toEqual({
            id: '123ABC',
            meta: {
                fileName: 'test.txt',
                title: 'test.txt',
                height: 100,
                size: 10,
                width: 200
            },
            url: '/uploads/test.txt'
        });
    });

    it('searches assets', async () => {
        nock('http://localhost:1337')
            .get('/api/upload/files?filters[mime][$containsi]=image&filters[caption][$containsi]=screenshot&sort[0]=createdAt:desc')
            .reply(200, [{
                id: '123ABC',
                caption: 'test.txt',
                name: 'test.txt',
                url: '/uploads/test.txt',
                size: 10,
                height: 100,
                width: 200,
            }]);

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        const results = await contentProvider.searchAssets(req, 'image', 'screenshot', 100, 0);

        expect(results).toBeTruthy();
        expect(results.meta.total).toBe(1);
        expect(results.hits).toEqual([{
            id: '123ABC',
            meta: {
                fileName: 'test.txt',
                title: 'test.txt',
                height: 100,
                size: 10,
                width: 200
            },
            url: '/uploads/test.txt'
        }]);
    });

    it('removes assets', async () => {
        nock('http://localhost:1337')
            .delete('/api/upload/files/123123')
            .reply(200);

        const contentProvider = new MashroomContentProviderStrapiImpl('http://localhost:1337', 'xxx');

        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
            }
        };

        await contentProvider.removeAsset(req, '123123');
    });

});
