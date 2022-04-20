
import context from '../../../context';

import type {Request, Response} from 'express';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomContentService} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';
import {MashroomContentApiError} from '../../../../../type-definitions';

export default async (req: Request, res: Response) => {
    const devMode = req.pluginContext.serverInfo.devMode;
    const securityService: MashroomSecurityService = req.pluginContext.services.security?.service;
    const contentService: MashroomContentService = req.pluginContext.services.content.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    logger.debug('Received search request:',  req.body);

    const { type: contentType } = req.params as paths['/content/api/{type}/searches']['post']['parameters']['path'];
    const {filter, locale, status, sort, limit, skip} = req.body as paths['/content/api/{type}/searches']['post']['requestBody']['content']['application/json'];

    try {
        const result = await contentService.searchContent<any>(req, contentType, filter, locale, status, sort as any, limit, skip);

        const response: paths['/content/api/{type}']['get']['responses']['200']['content']['application/json'] = result;

        if (!devMode && context.cacheEnable) {
            const authenticated = securityService.isAuthenticated(req);
            res.setHeader('Cache-Control', `${authenticated ? 'private' : 'public'}, max-age=${context.cacheTTLSec}`);
        }

        res.json(response);
    } catch (e: any) {
        const errorCode = e.message as MashroomContentApiError;
        if (errorCode === 'Invalid Filter') {
            logger.error(`Content search with invalid filter: ${filter}`, e);
            res.sendStatus(400);
        } else if (errorCode === 'Access Denied') {
            res.sendStatus(403);
        } else if (errorCode === 'Not Found') {
            res.sendStatus(404);
        } else {
            logger.error('Searching content failed', e);
            res.sendStatus(500);
        }
    }
};
