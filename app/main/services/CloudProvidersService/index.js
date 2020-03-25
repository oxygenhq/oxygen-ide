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
                                } else if(item.platform.startsWith('MacOS ')){
                                    osName = 'macOS';
                                    osVersion = item.platform.split('MacOS ')[1];
                                } else if(item.platform.startsWith('OS X ')){
                                    osName = 'OS X';
                                    osVersion = item.platform.split('OS X ')[1];
                                } else {
                                    console.log('Unsupported os item '+ JSON.stringify(item));
                                }
                            }

                            if(item.browsers && Array.isArray(item.browsers) && item.browsers.length > 0){
                                item.browsers.map((browser) => {

                                    if(browser.browser_name && browser.browser_name === 'Firefox' && parseInt(browser.version) < 55){
                                        // ignore  < 55
                                    } else if(browser.browser_name && browser.browser_name.toLowerCase() === 'chrome' && parseInt(browser.version) < 43){
                                        // ignore  < 43
                                    } else if(
                                        browser.browser_name &&
                                        browser.browser_name === 'Firefox' &&
                                        parseInt(browser.version) < 59 &&
                                        osName === 'OS X'
                                    ){
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
                    let platform = item.platform;
                    let name = item.name;

                    if(item && item.deviceName){
                        deviceName = item.deviceName;
                    }

                    if(item.name === 'chrome'){
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
                    

                    if(item.platform === YOSEMITE){
                        platform = MACOS;
                        deviceName = YOSEMITE;
                    }
                    if(item.platform === CAPITAN){
                        platform = MACOS;
                        deviceName = CAPITAN;
                    }
                    if(item.platform === CATALINA){
                        platform = MACOS;
                        deviceName = CATALINA;
                    }
                    if(item.platform === MOJAVE){
                        platform = MACOS;
                        deviceName = MOJAVE;
                    }
                    if(item.platform === SIERRA){
                        platform = MACOS;
                        deviceName = SIERRA;
                    }
                    if(item.platform === HIGH_SIERRA){
                        platform = MACOS;
                        deviceName = HIGH_SIERRA;
                    }
                    if(item.platform === MAVERICKS){
                        platform = MACOS;
                        deviceName = MAVERICKS;
                    }

                    if(item.platform === VISTA){
                        platform = WINDOWS;
                        deviceName = VISTA;
                    }
                    if(item.platform === WIN10){
                        platform = WINDOWS;
                        deviceName = '10';
                    }
                    if(item.platform === WIN8_1){
                        platform = WINDOWS;
                        deviceName = '8_1';
                    }
                    if(item.platform === WIN8){
                        platform = WINDOWS;
                        deviceName = '8';
                    }
                    if(item.platform === XP){
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
                        console.log('browsersAndDevices does not exist.', browsersAndDevices);
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
            throw new Error('Provider does not exist.');
        }
    }
}