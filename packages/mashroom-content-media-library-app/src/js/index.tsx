
import '../sass/style.scss';

import React from 'react';
import {createRoot} from 'react-dom/client';
import {Provider as ReduxProvider} from 'react-redux';
import createStore from './store/store';
import App from './components/App';

import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';
import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appConfig: {modalMode, responseChannelTopic, typeFilter}, lang} = portalAppSetup;
    const messageBus = clientServices.messageBus;
    const contentService: MashroomContentClientService = clientServices.contentService;

    const store = createStore();

    const root = createRoot(portalAppHostElement);
    root.render(
        <ReduxProvider store={store}>
            <App
                lang={lang}
                modalMode={!!modalMode}
                responseChannelTopic={responseChannelTopic}
                typeFilter={typeFilter}
                messageBus={messageBus}
                contentService={contentService}
            />
        </ReduxProvider>
    );

    return {
        willBeRemoved: () => {
            root.unmount();
        }
    };
};

(global as any).startMashroomContentMediaLibraryApp = bootstrap;
