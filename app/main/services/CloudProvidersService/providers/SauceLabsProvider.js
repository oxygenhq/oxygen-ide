import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';
import BrowserInfo from '../model/BrowserInfo';

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

        if (target && target.browserName) {
            
            if (target.browserName) {
                caps.browserName = target.browserName;
            }

            if (target.browserVersion) {
                caps.browserVersion = target.browserVersion;
            }

            if (target.osName) {
                caps.osName = target.osName;
            }
            
            if (target.osVersion) {
                caps.osVersion = target.osVersion;
            }
        } else {
            if (target.osName) {
                caps.osName = target.osName;
            }

            if (target.deviceName) {
                caps.deviceName = target.deviceName;
            }

            if (target.osVersion) {
                caps.osVersion = target.osVersion;
            }
        }
        caps.name = testName || null;
        caps.username = this.settings.username;
        caps.accessKey = this.settings.accessKey;
        caps.extendedDebugging = this.settings.extendedDebugging || false;
        caps.capturePerformance = this.settings.capturePerformance || false;

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        return options;
    }
}