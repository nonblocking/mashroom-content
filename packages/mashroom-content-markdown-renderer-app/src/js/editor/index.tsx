
import '../../sass/editor/style.scss';

import React from 'react';
import {Provider as ReduxProvider} from 'react-redux';
import {render, unmountComponentAtNode} from 'react-dom';
import createStore from './store/store';
import EditorContext from './EditorContext';
import Editor from './components/Editor';
import scrollToId from '../common/scrollToId';

import type {MashroomPortalAppPluginBootstrapFunction} from '@mashroom/mashroom-portal/type-definitions';
import type {MashroomContentClientService} from '@mashroom-content/mashroom-content-api/type-definitions';

(global as any).__mashroomContentGotoId = scrollToId;

const bootstrap: MashroomPortalAppPluginBootstrapFunction = (portalAppHostElement, portalAppSetup, clientServices) => {
    const {appId, appConfig: {editorTarget}, lang} = portalAppSetup;
    const {portalUserService, portalAppService, messageBus} = clientServices;
    const contentService: MashroomContentClientService = clientServices.contentService;

    if (!editorTarget || !editorTarget.pluginName) {
        throw new Error('This app can only be started as App Config Editor!');
    }

    const store = createStore();

    const context = {
        appId,
        lang,
        portalUserService,
        portalAppService,
        messageBus,
        contentService,
    };

    render((
        <ReduxProvider store={store}>
            <EditorContext.Provider value={context}>
                <Editor editorTarget={editorTarget} />
            </EditorContext.Provider>
        </ReduxProvider>
    ), portalAppHostElement);

    return {
        willBeRemoved: () => {
            unmountComponentAtNode(portalAppHostElement);
        }
    };
};

(global as any).startMashroomContentMarkdownRendererAppConfigEditor = bootstrap;
