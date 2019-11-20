import * as Providers from './providers';

export default class CloudProvidersService {
    getBrowsersAndDevices(providerName) {
        if (Providers.hasOwnProperty(providerName)) {
            return Providers[providerName]().getBrowsersAndDevices();
        }
        throw new Error("Provider does not exist.");
    }
}