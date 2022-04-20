
const {Router} = require('express');

const CONTENT_TYPE = 'markdowns';
const CONTENT_PROP = 'content';
const TITLE_PROP = 'title';

const api = () => {

    const router = Router();

    router.get('/', async (req, res) => {
        const portalService = req.pluginContext.services.portal.service;

        const markdownRendererAppInst = {
            pluginName: 'Mashroom Content Markdown Renderer App',
            instanceId: (Math.random() + 1).toString(36).substring(7),
            appConfig: {
                "contentType": CONTENT_TYPE,
                "contentProp": CONTENT_PROP,
                "titleProp": TITLE_PROP,
                "contentId": "2",
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

        res.end();
    });

    return router;
};

module.exports = api;
