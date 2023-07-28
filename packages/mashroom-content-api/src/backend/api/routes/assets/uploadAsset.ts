
import {existsSync, createReadStream} from 'fs';
import imageSizeOf from 'image-size';

import type {Request, Response} from 'express';
import type {MashroomContentService, MashroomContentAssetContentRef} from '../../../../../type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';

export default async (req: Request, res: Response) => {
    const contentService: MashroomContentService = req.pluginContext.services.content!.service;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const body = req.body as paths['/content/assets']['post']['requestBody']['content']['multipart/form-data'];
    const file: Express.Multer.File | undefined = req.file;

    if (!file) {
        logger.error('Asset upload error: No file found');
        res.sendStatus(400);
        return;
    }
    if (!existsSync(file.path)) {
        logger.error('Asset upload error: Tmp file not found:', file.path);
        res.sendStatus(400);
        return;
    }

    try {
        logger.debug(`Adding asset:`, file, body);
        const {path, contentRefType, contentRefId, contentRefFieldName, contentRefLocale} = body;
        const {path: tmpFilePath, originalname: fileName, mimetype: mimeType, size} = file;
        let width = undefined;
        let height = undefined;

        if (mimeType.startsWith('image/')) {
            try {
                const {width: imageWidth, height: imageHeight} = imageSizeOf(tmpFilePath);
                width = imageWidth;
                height = imageHeight;
            } catch (e) {
                logger.warn(`Calculating image size of ${tmpFilePath} failed`, e);
            }
        }

        const stream = createReadStream(tmpFilePath);
        let ref: MashroomContentAssetContentRef | undefined;
        if (contentRefType && contentRefId && contentRefFieldName) {
            ref = {
                type: contentRefType,
                id: contentRefId,
                fieldName: contentRefFieldName,
                locale: contentRefLocale,
            };
        }

        const result = await contentService.uploadAsset(req, stream, {
            title: fileName,
            fileName,
            mimeType,
            width,
            height,
            size,
        }, path, ref);

        const response: paths['/content/assets']['post']['responses']['200']['content']['application/json'] = result;

        res.json(response);
    } catch (e: any) {
        logger.error('Upload asset failed', e);
        res.sendStatus(500);
    }
};
