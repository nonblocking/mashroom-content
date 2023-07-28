
import type {Request, Response} from 'express';
import type {MashroomContentApiError, MashroomContentService} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const contentService: MashroomContentService = req.pluginContext.services.content!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const { type: contentType } = req.params as paths['/content/api/{type}']['post']['parameters']['path'];
    const content = req.body as paths['/content/api/{type}']['post']['requestBody']['content']['application/json'];

    try {
        logger.debug(`Inserting content of type ${contentType}:`, content);
        const result = await contentService.insertContent(req, contentType, content);
        const response:  paths['/content/api/{type}']['post']['responses']['200']['content']['application/json'] = result;
        res.json(response);
    } catch (e: any) {
        const errorCode = e.message as MashroomContentApiError;
        if (errorCode === 'Access Denied') {
            res.sendStatus(403);
        } else {
            logger.error('Inserting content failed', e);
            res.sendStatus(500);
        }
    }
};
