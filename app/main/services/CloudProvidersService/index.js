import * as Providers from './providers';
import ServiceBase from '../ServiceBase';
import BrowserInfo from './model/BrowserInfo';
import DeviceInfo from './model/DeviceInfo';
import { creteBrowsersTree, creteDevicesTree } from '../../helpers/cloudProviders';

// ANY - testingobject android
const devicesNames = ['android', 'ipad', 'iphone', 'any'];
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

        let cloudProviders;

        if (
            this.settings &&
            this.settings.cache &&
            this.settings.cache.settings &&
            this.settings.cache.settings.cloudProviders
        ) {
            cloudProviders = this.settings.cache.settings.cloudProviders;
        }

        if (!cloudProviders) {
            console.warn('No cloud providers defined');
            return;
        }
        for (var providerName in cloudProviders) {
            const providerSettings = cloudProviders[providerName];
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

    sortToBrowsersAndDevice(browsersAndDevices, providerName) {

        let browsers = [];
        let devices = [];
        
        if (providerName === 'perfectoMobile') {
            if (browsersAndDevices.devices) {
                
                if (browsersAndDevices.devices && Array.isArray(browsersAndDevices.devices) && browsersAndDevices.devices.length > 0) {
                    
                    browsersAndDevices.devices.map((item, idx) => {

                        let osName = '';
                        let version = '';
                        let osVersion = '';
                        let apiName = '';
                        let model = '';
    
                        if (item.os) {
                            if (item.os === 'iOS') {
                                apiName = 'iOS';
                                osName = 'Mac';
                                osVersion = item.osVersion;
                            } else if (item.os === 'Android') {
                                apiName = 'android';
                                osName = 'Linux';
                                osVersion = item.osVersion;
                            } else {
                                console.log('Unsupported os item ', item);
                            }
                        } else {
                            console.log('Unsupported item os ', item);
                        }


                        if (
                            item.model &&
                            item.model.startsWith('iPhone-')
                        ) {
                            model = 'iPhone';
                            version = item.model.split('iPhone-')[1];
                        } else if (
                            item.manufacturer &&
                            item.manufacturer === 'Samsung'
                        ) {
                            model = item.manufacturer;
                            version = item.model;
                        } else {
                            model = 'iPad';
                            version = item.model.replace('iPad ', '');
                        }
                        
                        devices.push(new DeviceInfo({
                            apiName: apiName,
                            id: item.deviceId,
                            name: model,
                            version: version,
                            osName: osName,
                            osVersion: osVersion
                        }));
                    });

                }
            }

            if (
                browsersAndDevices.browsers &&
                Array.isArray(browsersAndDevices.browsers) &&
                browsersAndDevices.browsers.length > 0
            ) {
                browsersAndDevices.browsers.map((item) => {
                    if (item.browserName && item.browserName === 'Edge' && parseInt(item.browserVersion) === 81 && parseInt(item.osVersion) === 10) {
                        // com.perfecto.wfa.server.errors.ErrorCodeException: WFA-500-0131 - Failed to run init script on remote machine.  Details: ' failure status is : 3'
                        // Build info: version: 'unknown', revision: 'unknown', time: 'unknown'
                        // System info: host: 'a4a036fcf1ff', ip: '172.17.0.4', os.name: 'Linux', os.arch: 'amd64', os.version: '4.14.123-86.109.amzn1.x86_64', java.version: '11.0.2'
                        // Driver info: driver.version: WebiumDriver
                    } else if (item.browserName && item.browserName === 'Internet Explorer' && parseInt(item.browserVersion) === 11) {
                        // com.perfecto.wfa.server.errors.ErrorCodeException: WFA-500-0000 - Internal Server Error  Details: 'Creating a new session failed.'
                        // Build info: version: 'unknown', revision: 'unknown', time: 'unknown'
                        // System info: host: 'cbd7e2169ec2', ip: '172.17.0.4', os.name: 'Linux', os.arch: 'amd64', os.version: '4.14.123-86.109.amzn1.x86_64', java.version: '11.0.2'
                        // Driver info: driver.version: WebiumDriver
                    } else if (parseInt(item.browserVersion) > 81) {
                        // not stable yet
                    } else {
                        browsers.push(new BrowserInfo({
                            apiName: item.browserName,
                            name: item.browserName,
                            version: item.browserVersion,
                            osName: item.osName,
                            osVersion: item.osVersion
                        }));
                    }
                });
            }
        }
        else if (providerName === 'sauceLabs') {

            if (browsersAndDevices.browsers && Array.isArray(browsersAndDevices.browsers) && browsersAndDevices.browsers.length > 0) {
                browsersAndDevices.browsers.map((item) => {
                    if (browsersNames.includes(item.api_name)) {

                        let osName = '';
                        let osVersion = '';

                        if (item.os) {
                            if (item.os.startsWith('Windows ')) {
                                osName = 'Windows';
                                osVersion = item.os.split('Windows ')[1];
                            } else if (item.os.startsWith('Mac ')) {
                                osName = 'Mac';
                                osVersion = item.os.split('Mac ')[1];
                            } else if (item.os.startsWith('Linux')) {
                                osName = 'Linux';
                                osVersion = '';
                            } else {
                                console.log('Unsupported os item '+ JSON.stringify(item));
                            }
                        } else {
                            console.log('Unsupported item os '+ JSON.stringify(item));
                        }

                        
                        if (item.api_name && item.api_name.toLowerCase() === 'firefox' && parseInt(item.short_version) < 55) {
                            // ignore firefox < 55
                        } else if (item.api_name && item.api_name.toLowerCase() === 'chrome' && parseInt(item.short_version) < 76) {
                            // ignore chrome < 76
                        } else if (item.api_name && item.api_name.toLowerCase() === 'internet explorer' && parseInt(item.short_version) < 10 ) {
                            // ignore internet explorer < 10
                        } else if (item.api_name && item.api_name === 'MicrosoftEdge' && item.short_version === 'dev' ) {
                            // ignore MicrosoftEdge dev
                        } else if (item.api_name && item.api_name === 'safari' && parseInt(item.short_version) < 12 ) {
                            // ignore safari < 12
                        } else if (item.api_name && item.api_name === 'safari' && parseInt(item.short_version) === 13 ) {
                            // UNKNOWN_ERROR - element not interactable: unknown error
                        } else {
                            
                            // console.log('===');
                            // console.log('api_name', item.api_name);
                            // console.log('long_name', item.long_name);
                            // console.log('short_version', item.short_version);
                            // console.log('===');

                            browsers.push(new BrowserInfo({
                                apiName: item.api_name,
                                name: item.long_name,
                                version: item.short_version,
                                osName: osName,
                                osVersion: osVersion
                            }));
                        }
                    } else {
                        // console.log('[108] Unsupported item '+ JSON.stringify(item));
                    }
                });
            }

        }
        else if (providerName === 'testObject') {
            if (browsersAndDevices.devices) {
                if (browsersAndDevices.devices && Array.isArray(browsersAndDevices.devices) && browsersAndDevices.devices.length > 0) {
                    browsersAndDevices.devices.map((item) => {
                        if (item.deviceFamily && item.deviceFamily.toLowerCase && devicesNames.includes(item.deviceFamily.toLowerCase())) {

                            let osName = '';
                            let osVersion = '';
                            let apiName = '';
        
                            if (item.os) {

                                // console.log('==');
                                // console.log('item.os', item.os);
                                // console.log('item', item);
                                // console.log('==');

                                if (item.os.startsWith('Mac ')) {
                                    apiName = 'iOS';
                                    osName = 'Mac';
                                    osVersion = item.os.split('Mac ')[1];
                                } else if (item.os === 'IOS') {
                                    apiName = 'iOS';
                                    osName = 'Mac';
                                    osVersion = item.osVersion;
                                } else if (item.os.startsWith('Linux')) {
                                    apiName = 'android';
                                    osName = 'Linux';
                                    osVersion = '';
                                } else if (item.os === 'ANDROID') {
                                    apiName = 'android';
                                    osName = 'Linux';
                                    osVersion = item.osVersion;
                                } else {
                                    console.log('Unsupported os item ', item);
                                }
                            } else {
                                console.log('Unsupported item os ', item);
                            }
        

                            
                            // console.log('===');
                            // console.log('apiName', apiName);
                            // console.log('name', item.name);
                            // console.log('version', item.osVersion);
                            // console.log('===');

                            if (apiName === 'android') {
                                if (item.name && item.name.startsWith('Samsung Galaxy S20')) {
                                    devices.push(new DeviceInfo({
                                        apiName: apiName,
                                        id: item.id,
                                        name: item.name,
                                        version: item.osVersion,
                                        osName: osName,
                                        osVersion: osVersion
                                    }));
                                }
                            }
                            // else {
                            //     devices.push(new DeviceInfo({
                            //         apiName: apiName,
                            //         id: item.id,
                            //         name: item.name,
                            //         version: item.osVersion,
                            //         osName: osName,
                            //         osVersion: osVersion
                            //     }));
                            // }
                        } else {
                            console.log('Unsupported item',item );
                        }
                    });

                }
            }
        }
        else if (providerName === 'browserStack') {
            if (browsersAndDevices && Array.isArray(browsersAndDevices) && browsersAndDevices.length > 0 && providerName) {
                browsersAndDevices.map((item) => {
                    if (item) {
                        if (item.real_mobile) {
                            // device
                            devices.push(new DeviceInfo({
                                apiName: item.os,
                                id: item.device,
                                name: item.device,
                                version: item.os_version,
                                osName: item.os,
                                osVersion: item.os_version
                            }));
                        } else {
                            // browser
                            if (item.browser && item.browser === 'firefox' && parseInt(item.browser_version) < 59) {
                                // ignore  < 59
                            } else if (item.browser && item.browser === 'chrome' && parseInt(item.browser_version) < 43) {
                                // ignore  < 43
                            } else if (item.browser && item.browser === 'opera') {
                                // ignore OperaDriver is not supported
                            } else {
                                browsers.push(new BrowserInfo({
                                    apiName: item.browser,
                                    name: item.browser,
                                    version: item.browser_version,
                                    osName: item.os,
                                    osVersion: item.os_version
                                }));
                            }
                        }
                    }
                });
            }
        }
        else if (browsersAndDevices && Array.isArray(browsersAndDevices) && browsersAndDevices.length > 0 && providerName) {
            browsersAndDevices.map((item) => {
                if (item) {
                    if (providerName === 'sauceLabs') {
                        if (devicesNames.includes(item.api_name)) {

                            let osName = '';
                            let osVersion = '';
                            let apiName = '';

                            if (item.os) {
                                if (item.os.startsWith('Mac ')) {
                                    apiName = 'iOS';
                                    osName = 'Mac';
                                    osVersion = item.os.split('Mac ')[1];
                                } else if (item.os.startsWith('Linux')) {
                                    apiName = 'android';
                                    osName = 'Linux';
                                    osVersion = '';
                                } else {
                                    console.log('Unsupported os item '+ JSON.stringify(item));
                                }
                            } else {
                                console.log('Unsupported item os '+ JSON.stringify(item));
                            }



                            devices.push(new DeviceInfo({
                                apiName: apiName,
                                id: item.device,
                                name: item.long_name,
                                version: item.short_version,
                                osName: osName,
                                osVersion: osVersion
                            }));
                        } else if (browsersNames.includes(item.api_name)) {

                            let osName = '';
                            let osVersion = '';

                            if (item.os) {
                                if (item.os.startsWith('Windows ')) {
                                    osName = 'Windows';
                                    osVersion = item.os.split('Windows ')[1];
                                } else if (item.os.startsWith('Mac ')) {
                                    osName = 'Mac';
                                    osVersion = item.os.split('Mac ')[1];
                                } else if (item.os.startsWith('Linux')) {
                                    osName = 'Linux';
                                    osVersion = '';
                                } else {
                                    console.log('Unsupported os item '+ JSON.stringify(item));
                                }
                            } else {
                                console.log('Unsupported item os '+ JSON.stringify(item));
                            }

                            browsers.push(new BrowserInfo({
                                apiName: item.api_name,
                                name: item.long_name,
                                version: item.short_version,
                                osName: osName,
                                osVersion: osVersion
                            }));
                        } else {
                            console.log('Unsupported item '+ JSON.stringify(item));
                        }
                    } else if (providerName === 'lambdaTest') {

                        if (item) {
                            
                            let osName = '';
                            let osVersion = '';

                            if (item.platform) {
                                if (item.platform.startsWith('Windows ')) {
                                    osName = 'Windows';
                                    osVersion = item.platform.split('Windows ')[1];
                                } else if (item.platform.startsWith('macOS ')) {
                                    osName = 'macOS';
                                    osVersion = item.platform.split('macOS ')[1];
                                } else if (item.platform.startsWith('MacOS ')) {
                                    osName = 'macOS';
                                    osVersion = item.platform.split('MacOS ')[1];
                                } else if (item.platform.startsWith('OS X ')) {
                                    osName = 'OS X';
                                    osVersion = item.platform.split('OS X ')[1];
                                } else {
                                    console.log('Unsupported os item '+ JSON.stringify(item));
                                }
                            }

                            if (item.browsers && Array.isArray(item.browsers) && item.browsers.length > 0) {
                                item.browsers.map((browser) => {

                                    if (browser.browser_name && browser.browser_name === 'Firefox' && parseInt(browser.version) < 55) {
                                        // ignore  < 55
                                    } else if (browser.browser_name && browser.browser_name.toLowerCase() === 'chrome' && parseInt(browser.version) < 43) {
                                        // ignore  < 43
                                    } else if (
                                        browser.browser_name &&
                                        browser.browser_name === 'Firefox' &&
                                        parseInt(browser.version) < 59 &&
                                        osName === 'OS X'
                                    ) {
                                        // ignore lambdatest vm fails on bootstrap
                                    }
                                    else {
                                        browsers.push(new BrowserInfo({
                                            apiName: browser.browser_name,
                                            name: browser.browser_name,
                                            version: browser.version,
                                            osName: osName,
                                            osVersion: osVersion
                                        }));
                                    }

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
        ) {
            if (Array.isArray(browsersAndDevices.devices) && browsersAndDevices.devices.length > 0) {
                browsersAndDevices.devices.map((item) => {
                    let version = '';
                    let osVersion = '';

                    if (item && item.test_environment && item.test_environment.version) {
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
            if (Array.isArray(browsersAndDevices.browsers) && browsersAndDevices.browsers.length > 0) {
                browsersAndDevices.browsers.map((item) => {
                    let deviceName = '';
                    let platform = item.platform;
                    let name = item.name;

                    if (item && item.deviceName) {
                        deviceName = item.deviceName;
                    }

                    if (item.name === 'chrome') {
                        name = 'Chrome';
                    }

                    const MACOS = 'MacOS';
                    const YOSEMITE = 'YOSEMITE';
                    const CAPITAN = 'CAPITAN';
                    const CATALINA = 'CATALINA';
                    const MOJAVE = 'MOJAVE';
                    const SIERRA = 'SIERRA';
                    const HIGH_SIERRA = 'HIGH-SIERRA';
                    const MAVERICKS = 'MAVERICKS';
                    
                    const WINDOWS = 'Windows';
                    const VISTA = 'VISTA';
                    const WIN10 = 'WIN10';
                    const WIN8 = 'WIN8';
                    const WIN8_1 = 'WIN8_1';
                    const XP = 'XP';
                    

                    if (item.platform === YOSEMITE) {
                        platform = MACOS;
                        deviceName = YOSEMITE;
                    }
                    if (item.platform === CAPITAN) {
                        platform = MACOS;
                        deviceName = CAPITAN;
                    }
                    if (item.platform === CATALINA) {
                        platform = MACOS;
                        deviceName = CATALINA;
                    }
                    if (item.platform === MOJAVE) {
                        platform = MACOS;
                        deviceName = MOJAVE;
                    }
                    if (item.platform === SIERRA) {
                        platform = MACOS;
                        deviceName = SIERRA;
                    }
                    if (item.platform === HIGH_SIERRA) {
                        platform = MACOS;
                        deviceName = HIGH_SIERRA;
                    }
                    if (item.platform === MAVERICKS) {
                        platform = MACOS;
                        deviceName = MAVERICKS;
                    }

                    if (item.platform === VISTA) {
                        platform = WINDOWS;
                        deviceName = VISTA;
                    }
                    if (item.platform === WIN10) {
                        platform = WINDOWS;
                        deviceName = '10';
                    }
                    if (item.platform === WIN8_1) {
                        platform = WINDOWS;
                        deviceName = '8_1';
                    }
                    if (item.platform === WIN8) {
                        platform = WINDOWS;
                        deviceName = '8';
                    }
                    if (item.platform === XP) {
                        platform = WINDOWS;
                        deviceName = XP;
                    }

                    browsers.push(new BrowserInfo({
                        apiName: name,
                        name: name,
                        version: item.version,
                        osName: platform,
                        osVersion: deviceName
                    }));
                });
            }

        }


        return {
            browsersTree: creteBrowsersTree(browsers),
            browsersList: browsers,
            devicesTree: creteDevicesTree(devices),
            devicesList: devices,
        };
    }

    async getBrowsersAndDevices(providerName, userName = null, key = null) {

        if (this.providers.hasOwnProperty(providerName)) {
            const provider = this.providers[providerName];

            if (provider && provider.getBrowsersAndDevices) {
                try {
                    const browsersAndDevices = await provider.getBrowsersAndDevices(userName, key);
                
                    if (providerName === 'sauceLabs') {
                        // sauceLabs
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else if (providerName === 'testObject') {
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else if (providerName === 'perfectoMobile') {
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else if (
                        browsersAndDevices && 
                        browsersAndDevices.platforms &&
                        browsersAndDevices.platforms.Desktop &&                         
                        Array.isArray(browsersAndDevices.platforms.Desktop) && 
                        browsersAndDevices.platforms.Desktop.length > 0
                    ) {
                        // lambdaTest
                        return this.sortToBrowsersAndDevice(browsersAndDevices.platforms.Desktop, providerName);
                    } else if (providerName === 'testingBot') {
                        // testingBot
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else if (providerName === 'browserStack') {
                        // browserStack
                        return this.sortToBrowsersAndDevice(browsersAndDevices, providerName);
                    } else {
                        console.log('ProviderName', providerName);
                        console.log('BrowsersAndDevices does not exist.', browsersAndDevices);
                        return `Failed to retrieve devices and browsers data from provider: ${providerName}. Looks like API changed or broken.`;
                    }
    
                }
                catch (e) {
                    console.warn(`Failed to retrieve devices and browsers data from provider: ${providerName}`);
                    console.warn('Reson : ', e);
                    return `Failed to retrieve devices and browsers data from provider: ${providerName}`;
                }                
            } else {
                throw new Error('provider.getBrowsersAndDevices does not exist.');
            }
        } else {

            console.log('this.providers : ', this.providers);
            console.log('providerName : ', providerName);

            throw new Error('Provider does not exist.');
        }
    }
}