
import MashroomContentProviderInternalStorageImpl from './MashroomContentProviderInternalStorageImpl';
import type {MashroomContentProviderPluginBootstrapFunction} from '@mashroom-content/mashroom-content-api/type-definitions';

const bootstrap: MashroomContentProviderPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {assetsFolder} = pluginConfig;
    const {serverConfig: {serverRootFolder}, loggerFactory} = pluginContextHolder.getPluginContext();
    return new MashroomContentProviderInternalStorageImpl(assetsFolder, serverRootFolder, loggerFactory);
};

export default bootstrap;
