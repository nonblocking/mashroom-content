
import type {Request, Response} from 'express';
import type {MashroomContentService, MashroomContentApiError} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const contentService: MashroomContentService = req.pluginContext.services.content!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const { type: contentType, id } = req.params as paths['/content/api/{type}/{id}']['put']['parameters']['path'];
    const content = req.body as paths['/content/api/{type}/{id}']['put']['requestBody']['content']['application/json'];

    try {
        logger.debug(`Updating content of type ${contentType} and id ${id}:`, content);
        const result = await contentService.updateContent(req, contentType, id, content);
        const response: paths['/content/api/{type}/{id}']['put']['responses']['200']['content']['application/json'] = result;
        res.json(response);
    } catch (e: any) {
        const errorCode = e.message as MashroomContentApiError;
        if (errorCode === 'Access Denied') {
            res.sendStatus(403);
        } else if (errorCode === 'Not Found') {
            res.sendStatus(404);
        } else {
            logger.error('Updating content failed', e);
            res.sendStatus(500);
        }
    }
};
