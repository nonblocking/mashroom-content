
const {createReadStream, readFileSync} = require('fs');
const {resolve} = require('path');
const {Router} = require('express');

const CONTENT_TYPE = 'markdowns';
const CONTENT_PROP = 'content';
const TITLE_PROP = 'title';

const api = () => {

    const router = Router();

    router.get('/', async (req, res) => {
        const portalService = req.pluginContext.services.portal.service;
        const contentService = req.pluginContext.services.content.service;
        const markdownContent = await contentService.searchContent(req, 'markdown');
        if (markdownContent.hits.length === 0) {
            console.info('Loading sample content...');

            const image = createReadStream(resolve(__dirname, 'content', 'mashroom_portal_ui.png'));
            const meta = {
                title: 'mashroom_portal_ui.png',
                fileName: 'mashroom_portal_ui.png',
                mimeType: 'image/png',
                width: 1477,
                height: 966,
            };
            const asset = await contentService.uploadAsset(req, image, meta);

            const content = await contentService.insertContent(req, CONTENT_TYPE, {
                data: {
                    [TITLE_PROP]: 'Test Content',
                    [CONTENT_PROP]: readFileSync(resolve(__dirname, 'content', 'test_en.md'))
                        .toString('utf-8')
                        .replace('IMAGE_URL', asset.url)
                        .replace('IMAGE_WIDTH', '1477')
                        .replace('IMAGE_HEIGHT', '966')
                },
                meta: {
                    locale: 'en',
                }
            });
            await contentService.updateContent(req, CONTENT_TYPE, content.id, {
                data: {
                    [TITLE_PROP]: 'Test Inhalt',
                    [CONTENT_PROP]: readFileSync(resolve(__dirname, 'content', 'test_de.md'))
                        .toString('utf-8')
                        .replace('IMAGE_URL', asset.url)
                        .replace('IMAGE_WIDTH', '1477')
                        .replace('IMAGE_HEIGHT', '966')
                },
                meta: {
                    locale: 'de',
                }
            });

            const markdownRendererAppInst = {
                pluginName: 'Mashroom Content Markdown Renderer App',
                instanceId: (Math.random() + 1).toString(36).substring(7),
                appConfig: {
                    "contentType": CONTENT_TYPE,
                    "contentProp": CONTENT_PROP,
                    "titleProp": TITLE_PROP,
                    "contentId": content.id,
                    "style": null,
                    "belowFold": false,
                    "fullscreenImageOnClick": true
                },
            };

            const pageHome = await portalService.getPage('home');
            pageHome.portalApps = {
                'app-area1': [{
                    pluginName: markdownRendererAppInst.pluginName,
                    instanceId: markdownRendererAppInst.instanceId,
                }],
            };

            await portalService.insertPortalAppInstance(markdownRendererAppInst);
            await portalService.updatePage(pageHome);
        }

        res.end();
    });

    return router;
};

module.exports = api;
