import type {MashroomContentProvider} from './index';

export interface MashroomContentProviderRegistry {
    registerContentProvider(name: string, provider: MashroomContentProvider): void;
    unregisterContentProvider(name: string): void;
    getContentProvider(name: string): MashroomContentProvider | undefined | null;
}
