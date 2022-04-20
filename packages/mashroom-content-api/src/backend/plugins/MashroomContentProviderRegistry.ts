
import type {MashroomContentProvider} from '../../../type-definitions';
import type {MashroomContentProviderRegistry as MashroomContentProviderRegistryType} from '../../../type-definitions/internal';

export default class MashroomContentProviderRegistry implements MashroomContentProviderRegistryType {

    private _providers: Record<string, MashroomContentProvider>;

    constructor() {
        this._providers = {};
    }

    registerContentProvider(providerName: string, provider: MashroomContentProvider): void {
        this._providers[providerName] = provider;
    }

    unregisterContentProvider(providerName: string): void {
        delete this._providers[providerName];
    }

    getContentProvider(providerName: string): MashroomContentProvider | undefined | null {
        return this._providers[providerName];
    }

}
