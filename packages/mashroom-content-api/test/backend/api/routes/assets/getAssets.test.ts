import getAsset from '../../../../../src/backend/api/routes/assets/getAsset';

const mockProcessAssetFromUri = jest.fn();

const pluginContext: any = {
    loggerFactory: () => console,
    services: {
        content: {
            rewrite: {
                rewriteUrl: (rq: any, downloadUrl: string) => downloadUrl.replace('/content/assets/proxy1', '/uploads'),
                getProxyConfig: () => ({
                    toFullUri: (downloadUrl: string) => `http://localhost:1234${downloadUrl}`,
                    allowImageProcessing: true,
                })
            }
        },
        assetProc: {
            service: {
                processAssetFromUri: mockProcessAssetFromUri,
            }
        }
    }
};

describe('getAsset', () => {

    beforeEach(() => {
        mockProcessAssetFromUri.mockReset();
    });

    it('processes a download request', async () => {
        let pipedStream = undefined;
        const headers: any = {};
        mockProcessAssetFromUri.mockReturnValue({
            stream: {
                pipe: (stream: any) => pipedStream = stream,
            },
            meta: {
                mimeType: 'image/webp',
                size: 1234,
            }
        });

        const req: any = {
            pluginContext,
            originalUrl: '/content/assets/proxy1/fooo.png',
            query: {
                _w: 1000,
                _format: 'webp'
            }
        };
        const res: any = {
            setHeader: (key: string, value: any) => headers[key] = value,
        };

        await getAsset(req, res);

        expect(mockProcessAssetFromUri.mock.calls[0][0]).toBe('http://localhost:1234/uploads/fooo.png');
        expect(headers).toEqual({
            'Content-Length': 1234,
            'Content-Type': 'image/webp'
        });
        expect(pipedStream).toBe(res);
    });

    it('handles a request with sourceFormat correctly', async () => {
        let pipedStream = undefined;
        const headers: any = {};
        mockProcessAssetFromUri.mockReturnValue({
            stream: {
                pipe: (stream: any) => pipedStream = stream,
            },
            meta: {
                mimeType: 'image/webp',
                size: 1234,
            }
        });

        const req: any = {
            pluginContext,
            originalUrl: '/content/assets/proxy1/fooo.webp',
            query: {
                _w: 1000,
                _sourceFormat: 'png',
                x: 2,
            }
        };
        const res: any = {
            setHeader: (key: string, value: any) => headers[key] = value,
        };

        await getAsset(req, res);

        expect(mockProcessAssetFromUri.mock.calls[0][0]).toBe('http://localhost:1234/uploads/fooo.png?x=2');
        expect(headers).toEqual({
            'Content-Length': 1234,
            'Content-Type': 'image/webp'
        });
        expect(pipedStream).toBe(res);
    });

});
