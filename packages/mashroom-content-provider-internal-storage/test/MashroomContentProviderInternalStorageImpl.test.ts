
import {existsSync} from 'fs';
import {resolve} from 'path';
import {Readable} from 'stream';
import {dummyLoggerFactory} from '@mashroom/mashroom-utils/lib/logging-utils';
import MashroomContentProviderInternalStorageImpl from '../src/MashroomContentProviderInternalStorageImpl';

const serverRootFolder = __dirname;
const assetFolder = resolve(__dirname, 'tmp');

const MOCK_STORED_MASTER_ENTRY = {
    _contentId: 'Rc2DJ8Tm',
    _contentType: 'foo',
    _contentLanguages: [
        'de',
        'en'
    ],
    _id: '5Y4ATOty'
};

const MOCK_STORED_ENTRY = {
    _contentId: 'Rc2DJ8Tm',
    _contentType: 'foo',
    _contentVersion: 1,
    _contentStatus: 'historic',
    _contentAvailableLanguages: [
        'de',
        'en'
    ],
    foo: 'bar',
    what: 'ever',
    _id: 'wo6NGImH'
};

describe('MashroomContentProviderInternalStorageImpl', () => {

    it('searches entries', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFind = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                find: mockFind,
                            }),
                        }
                    }
                }
            }
        };

        mockFind.mockResolvedValueOnce({
            result: [], totalCount: 2,
        });

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
        expect(mockFind.mock.calls.length).toBe(1);
        expect(mockFind.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentStatus: 'published'
                },
                {
                    foo: {
                       $not: {
                           $regex: 'test',
                           $options: 'i',
                       }
                    },
                    bar: {
                        $regex: 'xxx',
                    },
                    age: {
                        $lt: 90
                    }
                }
            ]
        });
    });

    it('finds a specific entry', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFindOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                findOne: mockFindOne,
                            }),
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_ENTRY);

        const entry = await contentProvider.getContent(req, 'my-content', '1234', 'de', undefined);

        expect(entry).toBeTruthy();
        expect(entry).toEqual({
            id: 'Rc2DJ8Tm',
            data: {
                foo: 'bar',
                what: 'ever'
            },
            meta: {
                availableLocales: [
                    'de',
                    'en'
                ],
                locale: 'de',
                version: '1'
            }
        });
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: '1234'
                },
                {
                    _contentStatus: 'published'
                },
            ]
        });
    });

    it('finds a specific entry version', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFindOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                findOne: mockFindOne,
                            }),
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValue(MOCK_STORED_ENTRY);

        await contentProvider.getContent(req, 'my-content', '1234', 'de', 22);

        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: '1234'
                },
                {
                    _contentVersion: 22
                },
            ]
        });
    });

    it('inserts an entry correctly', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        let inserts = 0;
        mockInsertOne.mockImplementation(({_contentId}) => {
            if (inserts === 0) {
                inserts ++;
                return Promise.resolve({
                    ...MOCK_STORED_MASTER_ENTRY,
                    _contentId,
                });
            } else {
                return Promise.resolve({
                    ...MOCK_STORED_ENTRY,
                    _contentId,
                });
            }
        });

        const result = await contentProvider.insertContent(req, 'my-content', {
            data: {
                what: 'ever',
                it: 'is'
            }
        });

        expect(result).toBeTruthy();
        expect(mockInsertOne.mock.calls.length).toBe(2);
        expect(mockInsertOne.mock.calls[0][0]).toMatchObject({
            _contentId: result.id,
            _contentLanguages: [
                'en'
            ],
            _contentType: 'my-content'
        });
        expect(mockInsertOne.mock.calls[1][0]).toMatchObject({
            _contentId: result.id,
            _contentAvailableLanguages: [
                'en'
            ],
            _contentStatus: 'published',
            _contentType: 'my-content',
            _contentVersion: 1,
            it: 'is',
            what: 'ever'
        });
    });

    it('updates an existing entry with versioning', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFind = jest.fn();
        const mockFindOne = jest.fn();
        const mockUpdateMany = jest.fn();
        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                find: mockFind,
                                findOne: mockFindOne,
                                updateMany: mockUpdateMany,
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);
        // Existing versions
        mockFind.mockResolvedValueOnce({
            result: [
                { _contentVersion: 2 },
                { _contentVersion: 1 },
            ]
        });
        mockInsertOne.mockImplementation(({_contentId}) => Promise.resolve({
            ...MOCK_STORED_ENTRY,
            _contentId,
        }));

        const result = await contentProvider.updateContent(req, 'my-content', 'Rc2DJ8Tm', {
            data: {
                what: 'ever2',
                it: 'is2'
            }
        });

        expect(result).toBeTruthy();
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockFind.mock.calls.length).toBe(1);
        expect(mockFind.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockUpdateMany.mock.calls.length).toBe(1);
        expect(mockUpdateMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[0][1]).toMatchObject({
            _contentStatus: 'historic',
        });
        expect(mockInsertOne.mock.calls.length).toBe(1);
        expect(mockInsertOne.mock.calls[0][0]).toMatchObject({
            _contentId: result.id,
            _contentAvailableLanguages: [
                'de',
                'en',
            ],
            _contentStatus: 'published',
            _contentType: 'my-content',
            _contentVersion: 3,
            it: 'is2',
            what: 'ever2'
        });
    });

    it('updates an existing entry with a new language', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const collections: Array<string> = [];
        const mockFindOne = jest.fn();
        const mockUpdateOne = jest.fn();
        const mockUpdateMany = jest.fn();
        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: (name: string) => {
                                collections.push(name);
                                return {
                                    findOne: mockFindOne,
                                    updateOne: mockUpdateOne,
                                    updateMany: mockUpdateMany,
                                    insertOne: mockInsertOne,
                                };
                            },
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);
        mockInsertOne.mockImplementation(({_contentId}) => Promise.resolve({
            ...MOCK_STORED_ENTRY,
            _contentId,
        }));

        const result = await contentProvider.updateContent(req, 'my-content', 'Rc2DJ8Tm', {
            data: {
                what: 'ever2',
                it: 'is2'
            },
            meta: {
                locale: 'fr'
            }
        });

        expect(collections).toEqual([
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-entries-fr',
            'mashroom-content-internal-storage-entries-de',
            'mashroom-content-internal-storage-entries-en'
        ]);
        expect(result).toBeTruthy();
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockUpdateMany.mock.calls.length).toBe(3);
        expect(mockUpdateMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[0][1]).toMatchObject({
            _contentAvailableLanguages: [
                'de',
                'en',
                'fr'
            ]
        });
        expect(mockUpdateMany.mock.calls[1][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[1][1]).toMatchObject({
            _contentAvailableLanguages: [
                'de',
                'en',
                'fr'
            ]
        });
        expect(mockUpdateMany.mock.calls[2][0]).toMatchObject({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[2][1]).toMatchObject({
            _contentStatus: 'historic',
        });
        expect(mockInsertOne.mock.calls.length).toBe(1);
        expect(mockInsertOne.mock.calls[0][0]).toMatchObject({
            _contentId: result.id,
            _contentAvailableLanguages: [
                'de',
                'en',
                'fr'
            ],
            _contentStatus: 'published',
            _contentType: 'my-content',
            _contentVersion: 1,
            it: 'is2',
            what: 'ever2'
        });
    });

    it('updates an existing entry with a draft version', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFind = jest.fn();
        const mockFindOne = jest.fn();
        const mockUpdateMany = jest.fn();
        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                find: mockFind,
                                findOne: mockFindOne,
                                updateMany: mockUpdateMany,
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);
        // Existing versions
        mockFind.mockResolvedValueOnce({
            result: [
                { _contentVersion: 2 },
                { _contentVersion: 1 },
            ]
        });
        mockInsertOne.mockImplementation(({_contentId}) => Promise.resolve({
            ...MOCK_STORED_ENTRY,
            _contentId,
        }));

        const result = await contentProvider.updateContent(req, 'my-content', 'Rc2DJ8Tm', {
            data: {
                what: 'ever2',
                it: 'is2'
            },
            meta: {
                status: 'draft',
            }
        });

        expect(result).toBeTruthy();
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockFind.mock.calls.length).toBe(1);
        expect(mockFind.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockUpdateMany.mock.calls.length).toBe(1);
        expect(mockUpdateMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content',
            _contentStatus: 'draft', // Update only existing draft versions
        });
        expect(mockUpdateMany.mock.calls[0][1]).toMatchObject({
            _contentStatus: 'historic',
        });
        expect(mockInsertOne.mock.calls.length).toBe(1);
        expect(mockInsertOne.mock.calls[0][0]).toMatchObject({
            _contentId: result.id,
            _contentAvailableLanguages: [
                'de',
                'en'
            ],
            _contentStatus: 'draft',
            _contentType: 'my-content',
            _contentVersion: 3,
            it: 'is2',
            what: 'ever2'
        });
    });

    it('removes existing entries', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const collections: Array<string> = [];
        const mockFindOne = jest.fn();
        const mockDeleteOne = jest.fn();
        const mockDeleteMany = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: (name: string) => {
                                collections.push(name);
                                return {
                                    findOne: mockFindOne,
                                    deleteOne: mockDeleteOne,
                                    deleteMany: mockDeleteMany,
                                };
                            },
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);
        mockDeleteMany.mockResolvedValue({ deletedCount: 2 });

        await contentProvider.removeContent(req, 'my-content', 'Rc2DJ8Tm');

        expect(collections).toEqual([
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-entries-de',
            'mashroom-content-internal-storage-entries-en'
        ]);
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockDeleteOne.mock.calls.length).toBe(1);
        expect(mockDeleteOne.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockDeleteMany.mock.calls.length).toBe(2);
        expect(mockDeleteMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockDeleteMany.mock.calls[1][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
    });

    it('removes specific languages', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const collections: Array<string> = [];
        const mockFindOne = jest.fn();
        const mockDeleteMany = jest.fn();
        const mockUpdateOne = jest.fn();
        const mockUpdateMany = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: (name: string) => {
                                collections.push(name);
                                return {
                                    findOne: mockFindOne,
                                    deleteMany: mockDeleteMany,
                                    updateOne: mockUpdateOne,
                                    updateMany: mockUpdateMany,
                                };
                            },
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);

        await contentProvider.removeContentParts(req, 'my-content', 'Rc2DJ8Tm', ['de']);

        expect(collections).toEqual([
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-entries-de',
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-entries-en',
        ]);
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockUpdateOne.mock.calls.length).toBe(1);
        expect(mockUpdateOne.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateOne.mock.calls[0][1]).toMatchObject({
            _contentLanguages: ['en'],
        });
        expect(mockUpdateMany.mock.calls.length).toBe(1);
        expect(mockUpdateMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[0][1]).toMatchObject({
            _contentAvailableLanguages: ['en'],
        });
    });

    it('removes specific languages and versions', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const collections: Array<string> = [];
        const mockFindOne = jest.fn();
        const mockDeleteOne = jest.fn();
        const mockDeleteMany = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: (name: string) => {
                                collections.push(name);
                                return {
                                    findOne: mockFindOne,
                                    deleteOne: mockDeleteOne,
                                    deleteMany: mockDeleteMany,
                                };
                            },
                        }
                    }
                }
            }
        };

        mockFindOne.mockResolvedValueOnce(MOCK_STORED_MASTER_ENTRY);
        mockDeleteMany.mockResolvedValue({ deletedCount: 2 });

        await contentProvider.removeContentParts(req, 'my-content', 'Rc2DJ8Tm', ['de'], [1, 2]);

        expect(collections).toEqual([
            'mashroom-content-internal-storage-master-entries',
            'mashroom-content-internal-storage-entries-de',
        ]);
        expect(mockFindOne.mock.calls.length).toBe(1);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockDeleteMany.mock.calls.length).toBe(1);
        expect(mockDeleteMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content',
            _contentVersion: { $in: [1, 2] }
        });
    });

    it('stores assets in the asset folder', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        const file = new Readable();
        file.push('test');
        file.push(null);

        const meta = {
            title: 'test.txt',
            fileName: 'test.txt',
            mimeType: 'text/plain',
        };

        const result = await contentProvider.uploadAsset(req, file, meta);

        expect(result).toBeTruthy();
        expect(result.url).toContain('test.txt');
        const downloadFile = resolve(assetFolder, result.url.split('/')[2]);
        expect(existsSync(downloadFile)).toBeTruthy();

        expect(mockInsertOne.mock.calls.length).toBe(1);
        expect(mockInsertOne.mock.calls[0][0].url).toBeTruthy();
        expect(mockInsertOne.mock.calls[0][0].meta).toEqual(meta);
    });

    it('stores assets in a subfolder', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        const file = new Readable();
        file.push('test2');
        file.push(null);

        const meta = {
            title: 'test2.txt',
            fileName: 'test2.txt',
            mimeType: 'text/plain',
        };

        const result = await contentProvider.uploadAsset(req, file, meta, 'subfolder/another-subfolder');

        expect(result).toBeTruthy();
        expect(result.url).toContain('/downloads/subfolder/another-subfolder/');
        expect(result.url).toContain('test2.txt');
        const downloadFile = resolve(assetFolder, result.url.split('/').slice(2).join('/'));

        expect(downloadFile.replace(/\\/g, '/')).toContain('/tmp/subfolder/another-subfolder/');
        expect(existsSync(downloadFile)).toBeTruthy();

        expect(mockInsertOne.mock.calls.length).toBe(1);
        expect(mockInsertOne.mock.calls[0][0].url).toBeTruthy();
        expect(mockInsertOne.mock.calls[0][0].meta).toEqual(meta);
    });

    it('links uploaded assets with existing entries', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFind = jest.fn();
        const mockFindOne = jest.fn();
        const mockUpdateMany = jest.fn();
        const mockInsertOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                find: mockFind,
                                findOne: mockFindOne,
                                updateMany: mockUpdateMany,
                                insertOne: mockInsertOne,
                            }),
                        }
                    }
                }
            }
        };

        let findOnes = 0;
        mockFindOne.mockImplementation(() => {
            if (findOnes === 0) {
                findOnes ++;
                return Promise.resolve(MOCK_STORED_MASTER_ENTRY);
            } else {
                return Promise.resolve(MOCK_STORED_ENTRY);
            }
        });
        mockFindOne.mockResolvedValueOnce(MOCK_STORED_ENTRY);
        // Existing versions
        mockFind.mockResolvedValueOnce({
            result: [
                { _contentVersion: 2 },
                { _contentVersion: 1 },
            ]
        });
        mockInsertOne.mockImplementation(({_contentId}) => Promise.resolve({
            ...MOCK_STORED_ENTRY,
            _contentId,
        }));

        const file = new Readable();
        file.push('test');
        file.push(null);

        const meta = {
            title: 'test.txt',
            fileName: 'test.txt',
            mimeType: 'text/plain',
        };
        const ref = {
            type: 'my-content',
            id: 'Rc2DJ8Tm',
            fieldName: 'what',
            locale: 'en',
        };

        const result = await contentProvider.uploadAsset(req, file, meta, undefined, ref);

        expect(result).toBeTruthy();
        expect(result.url).toContain('test.txt');
        const downloadFile = resolve(assetFolder, result.url.split('/')[2]);
        expect(existsSync(downloadFile)).toBeTruthy();

        expect(mockFindOne.mock.calls.length).toBe(2);
        expect(mockFindOne.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                },
                {
                    _contentStatus: 'published'
                }
            ]
        });
        expect(mockFindOne.mock.calls[1][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockFind.mock.calls.length).toBe(1);
        expect(mockFind.mock.calls[0][0]).toEqual({
            $and: [
                {
                    _contentType: 'my-content'
                },
                {
                    _contentId: 'Rc2DJ8Tm'
                }
            ]
        });
        expect(mockUpdateMany.mock.calls.length).toBe(1);
        expect(mockUpdateMany.mock.calls[0][0]).toEqual({
            _contentId: 'Rc2DJ8Tm',
            _contentType: 'my-content'
        });
        expect(mockUpdateMany.mock.calls[0][1]).toMatchObject({
            _contentStatus: 'historic',
        });
        expect(mockInsertOne.mock.calls.length).toBe(2);
        expect(mockInsertOne.mock.calls[1][0]).toMatchObject({
            _contentId: 'Rc2DJ8Tm',
            _contentAvailableLanguages: [
                'de',
                'en'
            ],
            _contentStatus: 'published',
            _contentType: 'my-content',
            _contentVersion: 3,
            foo: 'bar',
            what: result.url,
        });
    });

    it('searches assets', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockFind = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                find: mockFind,
                            }),
                        }
                    }
                }
            }
        };

        mockFind.mockResolvedValueOnce({
            result: [], totalCount: 2,
        });

        const results = await contentProvider.searchAssets(req, 'image', 'screenshot', 100, 0);

        expect(results).toBeTruthy();
        expect(results.meta.total).toBe(2);
        expect(mockFind.mock.calls.length).toBe(1);
        expect(mockFind.mock.calls[0][0]).toEqual({
            $and: [
                {
                    'meta.mimeType': {
                        $options: 'i',
                        $regex: 'image'
                    }
                },
                {
                    'meta.title': {
                        $options: 'i',
                        $regex: 'screenshot'
                    }
                }
            ]
        });
    });

    it('removes assets from the asset folder', async () => {
        const contentProvider = new MashroomContentProviderInternalStorageImpl(assetFolder, serverRootFolder, dummyLoggerFactory);

        const mockInsertOne = jest.fn();
        const mockFindOne = jest.fn();
        const mockDeleteOne = jest.fn();
        const req: any = {
            pluginContext: {
                loggerFactory: dummyLoggerFactory,
                services: {
                    storage: {
                        service: {
                            getCollection: () => ({
                                insertOne: mockInsertOne,
                                findOne: mockFindOne,
                                deleteOne: mockDeleteOne,
                            }),
                        }
                    }
                }
            }
        };

        const file = new Readable();
        file.push('test');
        file.push(null);

        const meta = {
            title: 'test.txt',
            fileName: 'test.txt',
            mimeType: 'text/plain',
        };

        const result = await contentProvider.uploadAsset(req, file, meta);

        expect(result).toBeTruthy();
        const downloadFile = resolve(assetFolder, result.url.split('/')[2]);
        expect(existsSync(downloadFile)).toBeTruthy();

        mockFindOne.mockReturnValue(result);
        await contentProvider.removeAsset(req, result.id);

        expect(existsSync(downloadFile)).toBeFalsy();
        expect(mockDeleteOne.mock.calls[0][0]).toEqual({
            _assetId: result.id,
        });
    });

});
