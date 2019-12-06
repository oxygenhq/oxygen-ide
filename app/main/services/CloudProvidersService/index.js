/* eslint-disable no-prototype-builtins */
import * as Providers from './providers';
import ServiceBase from '../ServiceBase';
import BrowserInfo from './model/BrowserInfo';
import DeviceInfo from './model/DeviceInfo';
import { creteBrowsersTree, creteDevicesTree } from '../../helpers/cloudProviders';

const devicesNames = ['android', 'ipad', 'iphone'];
const browsersNames = ['internet explorer', 'MicrosoftEdge', 'firefox', 'chrome', 'safari'];

export default class CloudProvidersService extends ServiceBase {
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
        const { cloudProviders } = this.settings || {};
        if (!cloudProviders) {
            console.warn('No cloud providers defined');
            return;
        }
        for (var providerName in cloudProviders) {
            const providerSettings = cloudProviders[providerName];
            if (!Providers.hasOwnProperty(providerName)) {
                continue;
            }

            const provider = this.providers[providerName] = new Providers[providerName](providerSettings);

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

    sortToBrowsersAndDevice(browsersAndDevices, providerName){

        let browsers = [];
        let devices = [];
        

        if(browsersAndDevices && Array.isArray(browsersAndDevices) && browsersAndDevices.length > 0 && providerName){
            browsersAndDevices.map((item) => {
                if(item){
                    if(providerName === 'sauceLabs'){
                        if(devicesNames.includes(item.api_name)){

                            let osName = '';
                            let osVersion = '';
                            let apiName = '';

                            if(item.os){
                                if(item.os.startsWith('Mac ')){
                                    apiName = 'iOS';
                                    osName = 'Mac';
                                    osVersion = item.os.split('Mac ')[1];
                                } else if(item.os.startsWith('Linux')){
                                    apiName = 'android';
                                    osName = 'Linux';
                                    osVersion = '';
                                } else {
                                    throw new Error('Unsupported os item '+ JSON.stringify(item));
                                }
                            } else {
                                throw new Error('Unsupported item os '+ JSON.stringify(item));
                            }



                            devices.push(new DeviceInfo({
                                apiName: apiName,
                                id: item.device,
                                name: item.long_name,
                                version: item.short_version,
                                osName: osName,
                                osVersion: osVersion
                            }));
                        } else if(browsersNames.includes(item.api_name)){

                            let osName = '';
                            let osVersion = '';

                            if(item.os){
                                if(item.os.startsWith('Windows ')){
                                    osName = 'Windows';
                                    osVersion = item.os.split('Windows ')[1];
                                } else if(item.os.startsWith('Mac ')){
                                    osName = 'Mac';
                                    osVersion = item.os.split('Mac ')[1];
                                } else if(item.os.startsWith('Linux')){
                                    osName = 'Linux';
                                    osVersion = '';
                                } else {
                                    throw new Error('Unsupported os item '+ JSON.stringify(item));
                                }
                            } else {
                                throw new Error('Unsupported item os '+ JSON.stringify(item));
                            }

                            browsers.push(new BrowserInfo({
                                apiName: item.api_name,
                                name: item.long_name,
                                version: item.short_version,
                                osName: osName,
                                osVersion: osVersion
                            }));
                        } else {
                            throw new Error('Unsupported item '+ JSON.stringify(item));
                        }
                    } else if(providerName === 'lambdaTest'){

                        if(item){
                            
                            let osName = '';
                            let osVersion = '';

                            if(item.platform){
                                if(item.platform.startsWith('Windows ')){
                                    osName = 'Windows';
                                    osVersion = item.platform.split('Windows ')[1];
                                } else if(item.platform.startsWith('macOS ')){
                                    osName = 'macOS';
                                    osVersion = item.platform.split('macOS ')[1];
                                } else if(item.platform.startsWith('OS X ')){
                                    osName = 'OS X';
                                    osVersion = item.platform.split('OS X ')[1];
                                } else {
                                    throw new Error('Unsupported os item '+ JSON.stringify(item));
                                }
                            }

                            if(item.browsers && Array.isArray(item.browsers) && item.browsers.length > 0){
                                item.browsers.map((browser) => {
                                    browsers.push(new BrowserInfo({
                                        apiName: browser.browser_name,
                                        name: browser.browser_name,
                                        version: browser.version,
                                        osName: osName,
                                        osVersion: osVersion
                                    }));
                                });
                            }
                        }
                    }
                }
            });
        } else if (
            providerName === 'testingBot' && 
            browsersAndDevices && 
            browsersAndDevices.devices && 
            browsersAndDevices.browsers
        ){
            if(Array.isArray(browsersAndDevices.devices) && browsersAndDevices.devices.length > 0){
                browsersAndDevices.devices.map((item) => {
                    let version = '';
                    let osVersion = '';

                    if(item && item.test_environment && item.test_environment.version){
                        version = item.test_environment.version;
                    }

                    devices.push(new DeviceInfo({
                        apiName: item.platform_name,
                        id: item.model_number,
                        name: item.name,
                        version: version,
                        osName: item.platform_name,
                        osVersion: osVersion
                    }));
                });
            }
            if(Array.isArray(browsersAndDevices.browsers) && browsersAndDevices.browsers.length > 0){
                browsersAndDevices.browsers.map((item) => {
                    let deviceName = '';

                    if(item && item.deviceName){
                        deviceName = item.deviceName;
                    }

                    browsers.push(new BrowserInfo({
                        apiName: item.name,
                        name: item.name,
                        version: item.version,
                        osName: item.platform,
                        osVersion: deviceName
                    }));
                });
            }

        }

        return {
            browsersTree: creteBrowsersTree(browsers),
            devicesTree: creteDevicesTree(devices)
        };
    }

    async getBrowsersAndDevices(providerName, userName = null, key = null) {

        if (this.providers.hasOwnProperty(providerName)) {
            const provider = this.providers[providerName];

            if (provider && provider.getBrowsersAndDevices) {
                try {
                    const browsersAndDevices = await provider.getBrowsersAndDevices(userName, key);
                
                
                    if (browsersAndDevices && Array.isArray(browsersAndDevices) && browsersAndDevices.length > 0) {
                        // sauceLabs
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else if(browsersAndDevices && browsersAndDevices.platforms && Array.isArray(browsersAndDevices.platforms) && browsersAndDevices.platforms.length > 0){
                        // lambdaTest
                        return this.sortToBrowsersAndDevice(browsersAndDevices.platforms, providerName);
                    } else if(providerName === 'testingBot'){
                        // testingBot
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else {
                        throw new Error('browsersAndDevices does not exist.', browsersAndDevices);
                    }
    
                }
                catch (e) {
                    console.warn(`Failed to retrieve devices and browsers data from provider: ${providerName}`);
                    return [];
                }                
            } else {
                throw new Error('provider.getBrowsersAndDevices does not exist.');
            }
        } else {
            throw new Error('Provider does not exist.');
        }
    }
}