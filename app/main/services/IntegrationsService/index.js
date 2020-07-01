import * as Providers from './providers';
import ServiceBase from '../ServiceBase';

export default class IntegrationProvidersService extends ServiceBase {
    constructor(mainWindow, settings) {
        super(mainWindow, settings);
        this.providers = {};
    }

    getProvider(name) {
        if (!this.providers || typeof(this.providers) !== 'object') {
            return null;
        }
        if (this.providers.hasOwnProperty(name)) {
            return this.providers[name];
        }
        return null;
    }
    
    start() {
        // initialize each enabled provider
        const { integrations } = this.settings || {};
        if (!integrations) {
            console.warn('No visual providers defined');
            return;
        }
        for (var providerName in integrations) {
            const providerSettings = integrations[providerName];
            if (!Providers.default.hasOwnProperty(providerName)) {
                continue;
            }

            const provider = this.providers[providerName] = new Providers.default[providerName](providerSettings);

            provider.start();
        }
    }

    stop() {
        for (var providerName in this.providers) {
            const provider = this.providers[providerName];
            provider.stop();
            delete this.providers[providerName];
        }
    }

    updateProviderSettings(providerName, settings) {
        if (!this.providers.hasOwnProperty(providerName)) {
            return;
        }
        const provider = this.providers[providerName];
        provider.updateSettings(settings);
    }
}