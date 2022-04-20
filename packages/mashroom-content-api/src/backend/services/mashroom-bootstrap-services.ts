
import context from '../context';
import MashroomContentServiceImpl from './MashroomContentServiceImpl';
import MashroomContentUrlRewriteServiceImpl from './MashroomContentUrlRewriteServiceImpl';

import type {MashroomServicesPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomServicesPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {provider, cacheEnable, cacheTTLSec} = pluginConfig;
    const {serverInfo} = pluginContextHolder.getPluginContext();

    context.cacheEnable = cacheEnable;
    context.cacheTTLSec = cacheTTLSec;

    const service = new MashroomContentServiceImpl(provider, context.pluginRegistry, cacheEnable, cacheTTLSec, serverInfo.devMode);
    const rewrite = new MashroomContentUrlRewriteServiceImpl(provider);

    return {
        service,
        rewrite,
    };
};

export default bootstrap;
