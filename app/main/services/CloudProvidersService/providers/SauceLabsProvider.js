import ICloudProvider from '../ICloudProvider';
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

    get isRunning() {
        return this.isRunning;
    }

    getBrowsersAndDevices() {
        return new Promise((resolve, reject) => {
            return fetch('https://saucelabs.com/rest/v1/info/platforms/webdriver')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }
    updateCapabilities(target, caps = {}) {
        if (!target) {
            throw new Error('"target must not be null');
        }
        else if (target.provider !== this.providerId) {
            throw new Error('Incompatible target provider');
        }
        else if (!this.settings || typeof this.settings !== 'object') {
            throw new Error('"settings" must not be null');
        }
        if (target instanceof BrowserInfo) {
            caps.browserName = target.name;
            if (target.osName) {
                caps.platform = target.osName;
            }
        }
        caps.name = testName || null;
        caps.username = this.settings.username;
        caps.accessKey = this.settings.accessKey;
        caps.extendedDebugging = this.settings.extendedDebugging || false;
        caps.capturePerformance = this.settings.capturePerformance || false;
    }
    updateOptions(options = {}) {
        options.seleniumUrl = this.settings.url;
        return options;
    }
}