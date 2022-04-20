
import context from '../../context';
import MashroomContentProviderLoader from './MashroomContentProviderLoader';

import type {MashroomPluginLoaderPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const storageProviderLoaderBootstrap: MashroomPluginLoaderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    return new MashroomContentProviderLoader(context.pluginRegistry, pluginContextHolder.getPluginContext().loggerFactory);
};

export default storageProviderLoaderBootstrap;
