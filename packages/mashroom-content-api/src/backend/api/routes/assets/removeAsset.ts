
import type {Request, Response} from 'express';
import type {MashroomContentService} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');
    const contentService: MashroomContentService = req.pluginContext.services.content.service;

    const { id } = req.params as paths['/content/assets/{id}']['delete']['parameters']['path'];

    logger.debug('Delete request for asset ID:', id);

    try {
        await contentService.removeAsset(req, id);
        res.end();
    } catch (e) {
        logger.error(`Removing asset ${id} failed!`, e);
        res.sendStatus(500);
    }
};
