
import MashroomContentProviderStrapiImpl from './MashroomContentProviderStrapiImpl';
import type {MashroomContentProviderPluginBootstrapFunction} from '@mashroom-content/mashroom-content-api/type-definitions';

const bootstrap: MashroomContentProviderPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {strapiUrl, apiToken} = pluginConfig;
    return new MashroomContentProviderStrapiImpl(strapiUrl, apiToken);
};

export default bootstrap;
