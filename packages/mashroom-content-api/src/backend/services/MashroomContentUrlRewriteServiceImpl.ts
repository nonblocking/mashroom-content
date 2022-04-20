
import context from '../context';

import type {Request} from 'express';
import type {MashroomSecurityService} from '@mashroom/mashroom-security/type-definitions';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';
import type {MashroomCDNService} from '@mashroom/mashroom-cdn/type-definitions';
import type {MashroomContentUrlRewriteService, MashroomContentProvider, MashroomContentApiAssetProxyConfig} from '../../../type-definitions';

const URL_REGEX = /(?:https?:\/\/|ftp:\/\/|file:\/\/|\/|\.\/|\.\.\/)[-A-Z0-9+&@#/%?=~_|!:,.;]*[A-Z0-9+&@#/%=~_|]/ig;

export default class MashroomContentUrlRewriteServiceImpl implements MashroomContentUrlRewriteService {

    constructor(private _providerName: string) {
    }

    rewriteContent(req: Request, content: string, reverse?: boolean): string {
        let rewrittenContent = content;

        content.match(URL_REGEX)?.forEach((url) => {
            rewrittenContent = rewrittenContent.replace(url, this.rewriteUrl(req, url, reverse));
        });

        return rewrittenContent;
    }

    rewriteUrl(req: Request, url: string, reverse?: boolean): string {
        const logger = req.pluginContext.loggerFactory('mashroom.content-api.service');
        const provider = this._getProvider();
        const assetProxies = provider.getAssetProxies();

        let rewrittenUrl = url;
        for (const proxyName of Object.keys(assetProxies)) {
            const assetProxy = assetProxies[proxyName];
            if (!reverse) {
                if (url.startsWith(assetProxy.urlPrefix)) {
                    rewrittenUrl = `${this._getProxyFrontendBasePath(req, proxyName)}${url.substring(assetProxy.urlPrefix.length)}`;
                    logger.debug(`Rewrite asset URL: ${url} -> ${rewrittenUrl}`);
                    break;
                }
            } else {
                const proxyBasePath = this._getProxyBasePath(proxyName);
                if (url.startsWith(proxyBasePath)) {
                    rewrittenUrl = `${assetProxy.urlPrefix}${url.substring(proxyBasePath.length)}`;
                    logger.debug(`Rewrite asset URL: ${url} -> ${rewrittenUrl}`);
                    break;
                }
            }
        }

        return rewrittenUrl;
    }

    getProxyConfig(url: string): MashroomContentApiAssetProxyConfig | undefined {
        const provider = this._getProvider();
        const assetProxies = provider.getAssetProxies();
        for (const proxyName of Object.keys(assetProxies)) {
            if (url.startsWith(this._getProxyBasePath(proxyName))) {
                return assetProxies[proxyName];
            }
        }
        return undefined;
    }

    private _getProxyFrontendBasePath(req: Request, proxyName: string): string {
        const securityService: MashroomSecurityService = req.pluginContext.services.security?.service;
        const cdnService: MashroomCDNService | undefined = req.pluginContext.services.cdn?.service;
        const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper?.service;

        const cdnHost = cdnService?.getCDNHost();
        let proxyPath = this._getProxyBasePath(proxyName);

        if (cdnHost && (!securityService || !securityService.isAdmin(req))) {
            // We use CDN only for non-admin users because otherwise reverse rewrite wouldn't work
            proxyPath = `${cdnHost}${proxyPath}`;
        } else if (pathMapperService) {
            const mappingInfo = pathMapperService.getMappingInfo(req);
            if (mappingInfo && mappingInfo.frontendBasePath && mappingInfo.frontendBasePath !== '/') {
                proxyPath = `${mappingInfo.frontendBasePath}${proxyPath}`;
            }
        }
        return proxyPath;
    }

    private _getProxyBasePath(proxyName: string): string {
        return `${context.contentApiBasePath}/assets/${proxyName}`;
    }

    private _getProvider(): MashroomContentProvider {
        const provider = context.pluginRegistry.getContentProvider(this._providerName);
        if (!provider) {
            throw new Error(`Content provider '${this._providerName}' not found!`);
        }
        return provider;
    }

}
