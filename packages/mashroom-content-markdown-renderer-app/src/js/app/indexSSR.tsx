
import React from 'react';
import {renderToString} from 'react-dom/server';
import App from './App';

import type {MashroomPortalAppPluginSSRBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentService} from '@mashroom-content/mashroom-content-api/type-definitions';

const bootstrap: MashroomPortalAppPluginSSRBootstrapFunction = async (portalAppSetup, req) => {
    const {appId, appConfig: {contentType, contentProp, contentId, style, belowFold, fullscreenImageOnClick}, lang} = portalAppSetup;

    const contentService: MashroomContentService = req.pluginContext.services.content.service;
    const {data} = await contentService.getContent<any>(req, contentType, contentId);
    const markdown = data[contentProp];

    const props = {
        contentType,
        contentProp,
        contentId,
        style,
        appId,
        fullscreenImageOnClick,
        belowFold,
        lang,
        imageBreakpoints: contentService.imageBreakpoints,
        imagePreferredFormats: contentService.imagePreferredFormats,
        contentService: {} as any,
        initialState: {
            markdown,
            error: false,
        }
    };

    const appHtml = renderToString(
        <App {...props} />
    );

    const serializedPreloadedState = JSON.stringify({markdown})
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"');

    return `
        <div>
            <script>
                 window['__PRELOADED_STATE_${appId}__'] = "${serializedPreloadedState}";
            </script>
            <div data-ssr-host="true">${appHtml}</div>
        </div>
    `;
};

export default bootstrap;
