
import context from '../context';

import type {MashroomPortalPageEnhancementPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomVHostPathMapperService} from '@mashroom/mashroom-vhost-path-mapper/type-definitions';

const bootstrap: MashroomPortalPageEnhancementPluginBootstrapFunction = () => {

    return {
        dynamicResources: {
            contentApiGlobalProperties: (sitePath, pageFriendlyUrl, lang, userAgent, req) => {
                let contentApiBasePath = context.contentApiBasePath;

                const pathMapperService: MashroomVHostPathMapperService = req.pluginContext.services.vhostPathMapper?.service;
                if (pathMapperService) {
                    contentApiBasePath = pathMapperService.getFrontendUrl(req, contentApiBasePath);
                }

                const imageBreakpointsSerialized = context.imageBreakpoints?.length ?
                    `[${context.imageBreakpoints.join(', ')}]` : '[]';
                const imagePreferredFormatsSerialized = context.imagePreferredFormats?.length ?
                    `["${context.imagePreferredFormats.join('", "')}"]` : '[]';

                return `
                    var MASHROOM_CONTENT_API_BASE_PATH = '${contentApiBasePath}';
                    var MASHROOM_CONTENT_API_IMAGE_BREAKPOINTS = ${imageBreakpointsSerialized};
                    var MASHROOM_CONTENT_API_IMAGE_PREFERRED_FORMATS = ${imagePreferredFormatsSerialized};
                `;
            }
        }
    };
};

export default bootstrap;
