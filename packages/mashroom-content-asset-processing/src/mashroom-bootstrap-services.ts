
import MashroomContentAssetProcServiceImpl from './MashroomContentAssetProcServiceImpl';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {scaleUp, defaultQuality, cacheEnable, cacheDefaultTTLSec, cacheFolder} = pluginConfig;
    const service = new MashroomContentAssetProcServiceImpl(scaleUp, defaultQuality, cacheEnable, cacheDefaultTTLSec, cacheFolder, pluginContextHolder);

    return {
        service,
    };
};

export default bootstrap;
