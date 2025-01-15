
import MashroomContentProviderStrapi4Impl from './MashroomContentProviderStrapi4Impl';
import MashroomContentProviderStrapi5Impl from './MashroomContentProviderStrapi5Impl';
import type {MashroomContentProviderPluginBootstrapFunction} from '@mashroom-content/mashroom-content-api/type-definitions';

const bootstrap: MashroomContentProviderPluginBootstrapFunction = async (pluginName, pluginConfig) => {
    const {strapiVersion, strapiUrl, apiToken} = pluginConfig;
    if (strapiVersion === 4 || strapiVersion === '4') {
        return new MashroomContentProviderStrapi4Impl(strapiUrl, apiToken);
    }
    return new MashroomContentProviderStrapi5Impl(strapiUrl, apiToken);
};

export default bootstrap;
