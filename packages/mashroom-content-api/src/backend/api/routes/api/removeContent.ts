
import type {Request, Response} from 'express';
import type {MashroomContentService, MashroomContentApiError} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const contentService: MashroomContentService = req.pluginContext.services.content!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const { type: contentType, id } = req.params as paths['/content/api/{type}/{id}']['delete']['parameters']['path'];
    const { locale, version } = req.query as paths['/content/api/{type}/{id}']['delete']['parameters']['query'];
    const locales = locale ? (Array.isArray(locale) ? locale : [locale]) : undefined;
    const versionsStr = version ? (Array.isArray(version) ? version : [version]) : undefined;

    try {
        const versions = versionsStr ? versionsStr.map((v) => parseInt(v)) : undefined;
        if (!locales && !versions) {
            logger.debug(`Removing content of type ${contentType} and id ${id}`);
            await contentService.removeContent(req, contentType, id);
        } else {
            logger.debug(`Removing content parts of type ${contentType} and id ${id}:`, locales, versions);
            await contentService.removeContentParts(req, contentType, id, locales, versions);
        }
        res.end();
    } catch (e: any) {
        const errorCode = e.message as MashroomContentApiError;
        if (errorCode == 'Access Denied') {
            res.sendStatus(403);
        } else if (errorCode == 'Not Found') {
            res.sendStatus(404);
        } else {
            logger.error('Removing content failed', e);
            res.sendStatus(500);
        }
    }
};
