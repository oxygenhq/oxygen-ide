import * as Providers from './providers';
import ServiceBase from '../ServiceBase';

export default class CloudProvidersService extends ServiceBase {
    async getBrowsersAndDevices(providerName) {

        console.log('getBrowsersAndDevices providerName', providerName);
        console.log('Providers', Providers);

        if (Providers.hasOwnProperty(providerName)) {
            const provider = Providers[providerName];

            if(provider && provider.getBrowsersAndDevices){
                return await provider.getBrowsersAndDevices();
            } else {
                throw new Error('provider.getBrowsersAndDevices does not exist.');
            }
        }
        throw new Error('Provider does not exist.');
    }
}