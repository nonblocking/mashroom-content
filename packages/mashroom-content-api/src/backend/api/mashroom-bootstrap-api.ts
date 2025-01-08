
import {isAbsolute, resolve} from 'path';
import {tmpdir} from 'os';
import context from '../context';
import routes from './routes';
import type {MashroomApiPluginBootstrapFunction} from '@mashroom/mashroom/type-definitions';

const bootstrap: MashroomApiPluginBootstrapFunction = async (pluginName, pluginConfig, pluginContextHolder) => {
    const {path, uploadTmpDir, images} = pluginConfig;
    const pluginContext = pluginContextHolder.getPluginContext();
    const {serverConfig: {serverRootFolder}} = pluginContext;
    const logger = pluginContext.loggerFactory('mashroom.content-api.service');

    context.contentApiBasePath = path;
    context.imageBreakpoints = images?.breakpoints || [];
    context.imagePreferredFormats = images?.preferredFormats || [];

    let tmpDir: string;
    if (uploadTmpDir) {
        if (isAbsolute(uploadTmpDir)) {
            tmpDir = uploadTmpDir;
        } else {
            tmpDir = resolve(serverRootFolder, uploadTmpDir);
        }
    } else {
        tmpDir = `${tmpdir()}/mashroom-content/asset-upload`;
    }

    logger.info('Using temp dir for asset uploads:', tmpDir);

    return routes(tmpDir);
};

export default bootstrap;
