
import '../../sass/app/style.scss';

import React from 'react';
import {createRoot, hydrateRoot, type Root} from 'react-dom/client';
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

    let root: Root;
    if (ssrHost) {
        // SSR
        console.info('SSR content found, hydrating App!');
        root = hydrateRoot(ssrHost, <App {...props} />);
    } else {
        // CSR
        root = createRoot(portalAppHostElement);
        root.render(<App {...props} />);
    }

    return {
        willBeRemoved: () => {
            root.unmount();
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

            root.unmount();
            root = createRoot(portalAppHostElement);
            root.render(<App {...props} />);
        },
    };
};

(global as any).startMashroomContentMarkdownRendererApp = bootstrap;
