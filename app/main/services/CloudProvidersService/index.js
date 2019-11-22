import * as Providers from './providers';
import ServiceBase from '../ServiceBase';
import BrowserInfo from './model/BrowserInfo';
import DeviceInfo from './model/DeviceInfo';

const devicesNames = ['android', 'ipad', 'iphone'];
const browsersNames = ['internet explorer', 'MicrosoftEdge', 'firefox', 'chrome', 'safari'];

export default class CloudProvidersService extends ServiceBase {
    constructor(mainWindow, settings) {
        super(mainWindow, settings);
        this.providers = {};
    }

    start() {
        // initialize each enabled provider
        const { cloudProviders } = this.settings || {};
        if (!cloudProviders) {
            console.warn('No cloud providers defined');
            return;
        }
        for (let providerName in cloudProviders) {
            const providerSettings = cloudProviders[providerName];
            if (!Providers.hasOwnProperty(providerName)) {
                continue;
            }
            const provider = this.providers[providerName] = new Providers[providerName](providerSettings);
            provider.start();
        }
    }

    stop() {
        for (let providerName in this.providers) {
            const provider = this.providers[providerName];
            provider.stop();
            delete providers[providerName];
        }
    }

    updateProviderSettings(providerName, settings) {
        if (!this.providers.hasOwnProperty(providerName)) {
            return;
        }
        const provider = this.providers[providerName];
        provider.updateSettings(settings);
    }

    getUniqueOsVersions(browsers){
        const result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            browsers.map((item) => {
                if(result.includes(item._osVersion)){
                    // ignore
                } else {
                    result.push(item._osVersion);
                }
            });
        }

        if(result && Array.isArray(result) && result.length > 1){
            return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
        }

        return result;
    }

    fillByOSVersion(browsers, key){
        let result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            const uniqueOsVersions = this.getUniqueOsVersions(browsers);

            if(uniqueOsVersions && Array.isArray(uniqueOsVersions) && uniqueOsVersions.length > 0){
                uniqueOsVersions.map((item) => {    
                    const saveItem = item || 'Unknown';
                    const newKey = key+'-'+saveItem;

                    result.push({
                        title: saveItem,
                        value: newKey,
                        key: newKey
                    });
                });
            }
        }

        return result;
    }

    getUniqueOsName(browsers){
        const result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            browsers.map((item) => {
                if(result.includes(item._osName)){
                    // ignore
                } else {
                    result.push(item._osName);
                }
            });
        }

        if(result && Array.isArray(result) && result.length > 1){
            return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
        }

        return result;
    }

    fillByOSName(browsers, key){
        let result = [];
        
        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            const uniqueOsNames = this.getUniqueOsName(browsers);
                        
            if(uniqueOsNames && Array.isArray(uniqueOsNames) && uniqueOsNames.length > 0){
                uniqueOsNames.map((item) => {
    
                    const newKey = key+'-'+item;

                    const browsersWithOsName = browsers.filter((browser) => browser._osName === item);

                    result.push({
                        title: item,
                        value: newKey,
                        key: newKey,
                        children: this.fillByOSVersion(browsersWithOsName, newKey)
                    });
                });
            }
        }

        return result;
    }

    getUniqueVersions(browsers){
        const result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            browsers.map((item) => {
                if(result.includes(item._version)){
                    // ignore
                } else {
                    result.push(item._version);
                }
            });
        }

        if(result && Array.isArray(result) && result.length > 1){
            return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
        }

        return result;
    }

    fillByBrowserName(browsers, apiName, key){
        let result = [];
        let items = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            browsers.map((item) => {
                if(item && item._apiName && item._apiName === apiName){
                    items.push(item);
                }
            });
        }

        if(items && Array.isArray(items) && items.length > 0){
            const uniqueVersions = this.getUniqueVersions(items);

            if(uniqueVersions && Array.isArray(uniqueVersions) && uniqueVersions.length > 0){
                uniqueVersions.map((item) => {    
                    const newKey = key+'-'+item;

                    const browsersWithVersion = items.filter((browser) => browser._version === item);

                    result.push({
                        title: item,
                        value: newKey,
                        key: newKey,
                        children: this.fillByOSName(browsersWithVersion, newKey)
                    });
                });
            }
        }

        return result;
    }

    getUniqueApiNames(browsers){
        const result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            browsers.map((item) => {
                if(result.includes(item._apiName)){
                    // ignore
                } else {
                    result.push(item._apiName);
                }
            });
        }

        if(result && Array.isArray(result) && result.length > 1){
            return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
        }

        return result;
    }

    creteBrowsersTree(browsers){
        let result = [];

        if(browsers && Array.isArray(browsers) && browsers.length > 0){
            const uniqueApiNames = this.getUniqueApiNames(browsers);

            if(uniqueApiNames && Array.isArray(uniqueApiNames) && uniqueApiNames.length > 0){
                result = uniqueApiNames.map((item) => {
                    return {
                        title: item,
                        value: item,
                        key: item,
                        children: this.fillByBrowserName(browsers, item, item)
                    };
                });
            }
        }

        return result;
    }

    fillByVersion(devices, key){
        let result = [];
        

        if(devices && Array.isArray(devices) && devices.length > 0){
            const uniqueVersions = this.getUniqueVersions(devices);

            if(uniqueVersions && Array.isArray(uniqueVersions) && uniqueVersions.length > 0){
                uniqueVersions.map((item) => {
    
                    const newKey = key+'-'+item;

                    result.push({
                        title: item,
                        value: newKey,
                        key: newKey
                    });
                });
            }
        }

        return result;
    }

    getUniqueNames(devices){
        const result = [];

        if(devices && Array.isArray(devices) && devices.length > 0){
            devices.map((item) => {
                if(result.includes(item.name)){
                    // ignore
                } else {
                    result.push(item.name);
                }
            });
        }

        if(result && Array.isArray(result) && result.length > 1){
            return result.sort((a, b) => a.localeCompare(b, 'en-US', {numeric : true}));
        }

        return result;
    }

    fillByDevicesName(devices, apiName, key){
        let result = [];
        let items = [];

        if(devices && Array.isArray(devices) && devices.length > 0){
            devices.map((item) => {
                if(item && item._apiName && item._apiName === apiName){
                    items.push(item);
                }
            });
        }

        if(items && Array.isArray(items) && items.length > 0){
            const uniqueNames = this.getUniqueNames(items);
            
            if(uniqueNames && Array.isArray(uniqueNames) && uniqueNames.length > 0){
                uniqueNames.map((item) => {
    
                    const newKey = key+'-'+item;

                    const devicesWithVersion = items.filter((device) => device._name === item);

                    result.push({
                        title: item,
                        value: newKey,
                        key: newKey,
                        children: this.fillByVersion(devicesWithVersion, newKey)
                    });
                });
            }
        }

        return result;
    }

    creteDevicesTree(devices){
        let result = [];
        
        if(devices && Array.isArray(devices) && devices.length > 0){
            
            const uniqueApiNames = this.getUniqueApiNames(devices);

            if(uniqueApiNames){
                result = uniqueApiNames.map((item) => {
                    return {
                        title: item,
                        value: item,
                        key: item,
                        children: this.fillByDevicesName(devices, item, item)
                    };
                });
            }
        }

        return result;
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
        }

        return {
            browsers,
            devices,
            browsersTree: this.creteBrowsersTree(browsers),
            devicesTree: this.creteDevicesTree(devices),
            origin: browsersAndDevices
        };
    }

    async getBrowsersAndDevices(providerName, userName = null, key = null) {

        if (Providers.hasOwnProperty(providerName)) {
            const provider = Providers[providerName];

            if(provider && provider.getBrowsersAndDevices){
                const browsersAndDevices = await provider.getBrowsersAndDevices(userName, key);
                if(browsersAndDevices && Array.isArray(browsersAndDevices) && browsersAndDevices.length > 0){
                    // sauceLabs
                    return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                } else if(browsersAndDevices && browsersAndDevices.platforms && Array.isArray(browsersAndDevices.platforms) && browsersAndDevices.platforms.length > 0){
                    // lambdaTest
                    return this.sortToBrowsersAndDevice(browsersAndDevices.platforms, providerName);
                } else {
                    throw new Error('browsersAndDevices does not exist.', browsersAndDevices);
                }

            } else {
                throw new Error('provider.getBrowsersAndDevices does not exist.');
            }
        }
        throw new Error('Provider does not exist.');
    }
}