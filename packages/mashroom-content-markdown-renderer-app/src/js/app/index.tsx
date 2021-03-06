
import '../../sass/app/style.scss';

import React from 'react';
import {render, hydrate, unmountComponentAtNode} from 'react-dom';
import App from './App';
import {EMPTY_STATE} from './reducer';
import scrollToId from '../common/scrollToId';

import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

(global as any).__mashroomContentGotoId = scrollToId;

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appId, appConfig: {contentType, contentProp, contentId, style, belowFold, fullscreenImageOnClick}, lang} = portalAppSetup;
    const contentService: MashroomContentClientService = clientServices.contentService;

    const preloadedStateStr = (global as any)[`__PRELOADED_STATE_${appId}__`];
    const ssrHost = portalAppHostElement.querySelector('[data-ssr-host="true"]');

    const props = {
        contentType,
        contentProp,
        contentId,
        style,
        appId,
        belowFold,
        fullscreenImageOnClick,
        lang,
        imageBreakpoints: contentService.imageBreakpoints,
        imagePreferredFormats: contentService.imagePreferredFormats,
        contentService,
        initialState: preloadedStateStr ? JSON.parse(preloadedStateStr) : EMPTY_STATE,
    };

    if (ssrHost) {
        // SSR
        console.info('SSR content found, hydrating App!');
        hydrate(<App {...props} />, ssrHost);
    } else {
        // CSR
        render(<App {...props} />, portalAppHostElement);
    }

    return {
        willBeRemoved: () => {
            unmountComponentAtNode(portalAppHostElement);
        },
        updateAppConfig: ({contentType, contentId, style}) => {
            console.info('Rerending App because appConfig changed');
            const newProps = {
                ...props,
                contentType,
                contentId,
                style,
                initialState: EMPTY_STATE,
            }

            unmountComponentAtNode(portalAppHostElement);
            render(<App {...newProps} />, portalAppHostElement);
        },
    };
};

(global as any).startMashroomContentMarkdownRendererApp = bootstrap;
