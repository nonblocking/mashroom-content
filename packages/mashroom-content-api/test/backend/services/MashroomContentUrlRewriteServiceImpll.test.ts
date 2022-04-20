
import context from '../../../src/backend/context';
import MashroomContentUrlRewriteServiceImpl from '../../../src/backend/services/MashroomContentUrlRewriteServiceImpl';

const dummyProvider: any = {
    getAssetProxies: () => ({
        p1: {
            urlPrefix: '/uploads'
        },
        p2: {
            urlPrefix: 'http://localhost:1234'
        }
    }),
}
context.pluginRegistry.registerContentProvider('dummy', dummyProvider);

const pluginContext: any = {
    loggerFactory: () => console,
    services: {}
};

describe('MashroomContentUrlRewriteServiceImpl', () => {

    it('rewrites the URLs in the content', async () => {
        const service = new MashroomContentUrlRewriteServiceImpl('dummy');

        const req: any = {
            pluginContext,
        }

        const content = `
            URL in markdown: ![the image](http://localhost:1234/foo/bar.png)

            and some html with an asset:

            <img src="/uploads/whatever.jpeg"></img>

            woohoo
        `;

        const rewrittenContent = service.rewriteContent(req, content);

        expect(rewrittenContent).toBe(`
            URL in markdown: ![the image](/content/assets/p2/foo/bar.png)

            and some html with an asset:

            <img src="/content/assets/p1/whatever.jpeg"></img>

            woohoo
        `);
    });

    it('reverse rewrites the URLs in the content', async () => {
        const service = new MashroomContentUrlRewriteServiceImpl('dummy');

        const req: any = {
            pluginContext,
        }

        const content = `
            URL in markdown: ![the image](/content/assets/p2/foo/bar.png)

            and some html with an asset:

            <img src="/content/assets/p1/whatever.jpeg"></img>

            woohoo
        `;

        const rewrittenContent = service.rewriteContent(req, content, true);

        expect(rewrittenContent).toBe(`
            URL in markdown: ![the image](http://localhost:1234/foo/bar.png)

            and some html with an asset:

            <img src="/uploads/whatever.jpeg"></img>

            woohoo
        `);
    });

    it('rewrites the URLs in nested content properties', async () => {
        const service = new MashroomContentUrlRewriteServiceImpl('dummy');

        const req: any = {
            pluginContext,
        }

        const content = `
            URL in markdown: ![the image](http://localhost:1234/foo/bar.png)

            and some html with an asset:

            <img src="/uploads/whatever.jpeg"></img>

            woohoo
        `;

        const rewrittenContent = service.rewriteContent(req, content);

        expect(rewrittenContent).toBe(`
            URL in markdown: ![the image](/content/assets/p2/foo/bar.png)

            and some html with an asset:

            <img src="/content/assets/p1/whatever.jpeg"></img>

            woohoo
        `);
    });

    it('rewrites the URLs in the content with active CDN', async () => {
        const service = new MashroomContentUrlRewriteServiceImpl('dummy');

        const req: any = {
            pluginContext: {
                ...pluginContext,
                services: {
                    cdn: {
                        service: {
                            getCDNHost: () => 'http://cdn1.test-server.com',
                        }
                    }
                }
            },
        }

        const content = `
            URL in markdown: ![the image](http://localhost:1234/foo/bar.png)

            and some html with an asset:

            <img src="/uploads/whatever.jpeg"></img>

            woohoo
        `;

        const rewrittenContent = service.rewriteContent(req, content);

        expect(rewrittenContent).toBe(`
            URL in markdown: ![the image](http://cdn1.test-server.com/content/assets/p2/foo/bar.png)

            and some html with an asset:

            <img src="http://cdn1.test-server.com/content/assets/p1/whatever.jpeg"></img>

            woohoo
        `);
    });
});
