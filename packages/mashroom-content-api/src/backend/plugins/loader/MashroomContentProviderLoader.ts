
import type {
    MashroomPluginLoader,
    MashroomPlugin,
    MashroomPluginConfig,
    MashroomPluginContextHolder,
    MashroomLoggerFactory,
    MashroomLogger,
} from '@mashroom/mashroom/type-definitions';
import type {MashroomContentProviderPluginBootstrapFunction} from '../../../../type-definitions';
import type {MashroomContentProviderRegistry} from '../../../../type-definitions/internal';

export default class MashroomContentProviderLoader implements MashroomPluginLoader {

    private _logger: MashroomLogger;

    constructor(private _contentProviderRegistry: MashroomContentProviderRegistry, loggerFactory: MashroomLoggerFactory) {
        this._logger = loggerFactory('mashroom.content-api.provider.loader');
    }

    generateMinimumConfig(): MashroomPluginConfig {
        return {
        };
    }

    async load(plugin: MashroomPlugin, config: MashroomPluginConfig, contextHolder: MashroomPluginContextHolder): Promise<void> {
        const bootstrap: MashroomContentProviderPluginBootstrapFunction = plugin.requireBootstrap();
        const contentProvider = await bootstrap(plugin.name, config, contextHolder);
        this._logger.info(`Registering content provider: ${plugin.name}`);
        this._contentProviderRegistry.registerContentProvider(plugin.name, contentProvider);

    }

    async unload(plugin: MashroomPlugin): Promise<void> {
        this._logger.info(`Unregistering content provider provider: ${plugin.name}`);
        this._contentProviderRegistry.unregisterContentProvider(plugin.name);
    }

    get name(): string {
        return 'Content Provider Plugin Loader';
    }

}
