import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';

export default class SauceLabsProvider extends CloudProviderBase {
    constructor(settings) {
        super(settings);
        this.isRunning = false;
    }

    start() {
        if (!this.settings || !this.settings.inUse) {
            return;
        }
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    isRunning() {
        return this.isRunning;
    }

    updateSettings(settings){
        this.settings=settings;
    }
    
    getBrowsersAndDevices() {
        return new Promise((resolve, reject) => {
            return fetch('https://saucelabs.com/rest/v1/info/platforms/webdriver')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }
    updateCapabilities(target, caps = {}, testName) {
        if (!target) {
            throw new Error('"target" must not be null');
        }
        else if (target.provider !== this.providerId) {
            throw new Error('Incompatible target provider');
        }
        else if (!this.settings || typeof this.settings !== 'object') {
            throw new Error('"settings" must not be null');
        }

        if(!this.settings.username){
            throw new Error('"username" must not be null');
        }

        if(!this.settings.accessKey){
            throw new Error('"accessKey" must not be null');
        }

        console.log('target', target);

        if (target && target.browserName) {
            
            if (target.browserName) {
                caps.browserName = target.browserName;
            }

            if (target.browserVersion) {
                caps.browserVersion = target.browserVersion;
            }

            if (target.osName) {
                caps.platformName = target.osName;
            }
            
            if (target.osVersion) {
                caps.platformName += ' '+target.osVersion;
            }
        } else {

            if (target.osName) {
                caps.platformName = target.osName;

                if(target.osName === 'android'){
                    caps.browserName = 'Android';
                } else {
                    caps.browserName = 'Safari';
                }
            }

            if (target.deviceName) {
                caps.deviceName = target.deviceName;
            }

            if (target.osVersion) {
                caps.platformVersion = target.osVersion;
            }
            
            // caps.deviceName = 'iPad Air 2';
            // // caps.automationName = 'UiAutomator2',
            // caps.testobject_app_id = '1';
            // caps.testobject_api_key = '538928FCB13C48EA87DB885DD1FB2F69';
            // caps.testobject_test_name = 'wdio-demo-app-test';
            // caps.platformName = 'iOS';
            // // caps.idleTimeout = 180;
            // // caps.maxInstances = 6;
            // // caps.testobject_cache_device = true;
            // // caps.noReset = true;
            // // caps.orientation = 'PORTRAIT';
            // // caps.newCommandTimeout = 180;
            // // caps.phoneOnly = true;
            // // caps.tabletOnly = false;

            // // caps.appiumVersion = '1.15.0';
            // caps.platformVersion = '12.1.4';
            // caps.browserName = 'Safari';
        }
        caps['sauce:options'] = {
            name: testName || null,
            username: this.settings.username,
            accessKey: this.settings.accessKey,
            extendedDebugging: this.settings.extendedDebugging || false,
            capturePerformance: this.settings.capturePerformance || false
        };

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        options.appiumUrl = this.settings.url;
        return options;
    }
}