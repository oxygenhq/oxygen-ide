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

    getBrowsers(){
        return new Promise((resolve, reject) => {
            return fetch('https://saucelabs.com/rest/v1/info/platforms/webdriver')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }
    
    async getBrowsersAndDevices() {
        let browsers = [];
        browsers = await this.getBrowsers();
        return {
            browsers: browsers
        };
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
        }

        caps['sauce:options'] = {
            name: testName || null,
            username: this.settings.username,
            accessKey: this.settings.accessKey,
            extendedDebugging: this.settings.extendedDebugging || false,
            capturePerformance: this.settings.capturePerformance || false,
        };

        return caps;
    }
    updateOptions(target, options = {}) {
        console.log('ssthis.settings', this.settings);
        options.seleniumUrl = this.settings.url;
        return options;
    }
}