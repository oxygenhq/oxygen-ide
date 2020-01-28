/* eslint-disable no-prototype-builtins */
import * as Providers from './providers';
import ServiceBase from '../ServiceBase';

export default class VisualTestingProvidersService extends ServiceBase {
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
        const { visualProviders } = this.settings || {};
        if (!visualProviders) {
            console.warn('No visual providers defined');
            return;
        }
        for (var providerName in visualProviders) {
            const providerSettings = visualProviders[providerName];
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