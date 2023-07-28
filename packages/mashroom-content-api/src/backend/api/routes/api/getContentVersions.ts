
import context from '../../../context';

import type {MashroomContentApiError, MashroomContentService} from '../../../../../type-definitions';
import type {Request, Response} from 'express';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const devMode = req.pluginContext.serverInfo.devMode;
    const securityService: MashroomSecurityService = req.pluginContext.services.security?.service;
    const contentService: MashroomContentService = req.pluginContext.services.content!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const { type: contentType, id } = req.params as paths['/content/api/{type}/{id}/versions']['get']['parameters']['path'];
    const { locale } = req.query as paths['/content/api/{type}/{id}']['get']['parameters']['query'];

    try {
        const result = await contentService.getContentVersions<any>(req, contentType, id, locale);

        const response: paths['/content/api/{type}/{id}/versions']['get']['responses']['200']['content']['application/json'] = result;

        if (!devMode && context.cacheEnable) {
            const authenticated = securityService.isAuthenticated(req);
            res.setHeader('Cache-Control', `${authenticated ? 'private' : 'public'}, max-age=${context.cacheTTLSec}`);
        }

        res.json(response);
    } catch (e: any) {
        const errorCode = e.message as MashroomContentApiError;
        if (errorCode === 'Access Denied') {
            res.sendStatus(403);
        } else if (errorCode === 'Not Found') {
            res.sendStatus(404);
        } else {
            logger.error('Fetching content failed', e);
            res.sendStatus(500);
        }
    }
};
