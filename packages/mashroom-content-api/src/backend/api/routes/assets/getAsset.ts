
import {stringify} from 'querystring';
import context from '../../../context';

import type {Request, Response} from 'express';
import type {MashroomContentAssetProcService} from '@mashroom-content/mashroom-content-asset-processing/type-definitions';
import type {MashroomCacheControlService} from '@mashroom/mashroom-browser-cache/type-definitions';
import type {paths} from '../../../../../type-definitions/rest-api';
import type {MashroomContentUrlRewriteService} from '../../../../../type-definitions';

const FILE_EXT_REGEX = /\.(\w{3,4})(?:$|\?)/;

export default async (req: Request, res: Response) => {
    const urlRewriteService: MashroomContentUrlRewriteService = req.pluginContext.services.content.rewrite;
    const assetProcessor: MashroomContentAssetProcService = req.pluginContext.services.assetProc.service;
    const cacheControlService: MashroomCacheControlService = req.pluginContext.services.browserCache?.cacheControl;
    const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');

    const { _w, _format, _q, _sourceFormat } = req.query as paths['/content/assets/{proxyName}/{assetPath}']['get']['parameters']['query'];
    const cleanQuery = {...req.query};
    delete cleanQuery._w;
    delete cleanQuery._format;
    delete cleanQuery._q;
    delete cleanQuery._sourceFormat;

    let downloadUrl = decodeURI(req.originalUrl.split('?')[0]);
    if (Object.keys(cleanQuery).length > 0) {
        downloadUrl += `?${stringify(cleanQuery as any)}`;
    }
    logger.debug('Request for asset:', downloadUrl);

    let format = _format;
    if (_sourceFormat) {
        const fileExtMatch = downloadUrl.match(FILE_EXT_REGEX);
        if (fileExtMatch) {
            format = fileExtMatch[1] as any;
            downloadUrl = downloadUrl.replace(`.${format}`, `.${_sourceFormat}`);
        }
    }

    let fullDownloadUri;
    const proxyConfig = urlRewriteService.getProxyConfig(downloadUrl);
    if (proxyConfig) {
        const rewrittenDownloadUrl = urlRewriteService.rewriteUrl(req, downloadUrl, true);
        if (proxyConfig.toFullUri) {
            fullDownloadUri = proxyConfig.toFullUri(rewrittenDownloadUrl);
        } else {
            fullDownloadUri = rewrittenDownloadUrl;
        }
        logger.debug(`Determined download URI: ${downloadUrl} -> ${fullDownloadUri}`)
    } else {
        res.sendStatus(404);
        return;
    }

    try {
        let asset;
        if (proxyConfig?.allowImageProcessing) {
            let resize, convert;
            const width = _w ? parseInt(_w) : undefined;
            if (width) {
                if (context.imageBreakpoints.indexOf(width) !== -1) {
                    resize = { width };
                } else {
                    logger.warn(`Image resizing rejected because given width is no valid breakpoint: ${width}`);
                }
            }
            if (format) {
                if (context.imagePreferredFormats.indexOf(format) !== -1) {
                    convert = { format, quality: _q ? parseInt(_q) : undefined };
                } else {
                    logger.warn(`Image conversion rejected because format is not valid: ${format}`);
                }
            }
            asset = await assetProcessor.processAssetFromUri(fullDownloadUri, resize, convert);
        } else {
            asset = await assetProcessor.processAssetFromUri(fullDownloadUri);
        }
        res.setHeader('Content-Type', asset.meta.mimeType);
        if (asset.meta.size) {
            res.setHeader('Content-Length', asset.meta.size);
        }

        if (cacheControlService) {
            cacheControlService.addCacheControlHeader('PRIVATE_IF_AUTHENTICATED', req, res);
        }

        asset.stream.pipe(res);
    } catch (e) {
        logger.error(`Fetching asset ${downloadUrl} failed!`, e);
        res.sendStatus(500);
    }
};
