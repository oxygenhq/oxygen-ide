import CloudProviderBase from '../CloudProviderBase';
const fetch = require('node-fetch');

export default class BrowserStackService extends CloudProviderBase {
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

    updateSettings(settings) {
        this.settings=settings;
    }

    async getBrowsersAndDevices() {
        if (this.settings && this.settings.key && this.settings.secret) {
            let fetchFn;

            if (typeof fetch === 'function') {
                fetchFn = fetch;
            } else if (fetch && fetch.default && typeof fetch.default === 'function') {
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('BrowserStackService: fetchFn not found');
            }

            const response = await fetchFn('https://api.browserstack.com/automate/browsers.json',
            {
                method:'GET',
                headers: {
                    'Authorization' : 'Basic ' + Buffer.from(this.settings.key + ':' + this.settings.secret).toString('base64')
                },
            });
            if (response) {
                return response.json();
            }
            // not suppose to happen
            return null;
        } else {
            throw new Error('BrowserStackService: invalid credentials');
        }
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
                caps.version = target.browserVersion;
            }

            if (target.osName) {
                caps.platform = target.osName;
            }
            
            if (target.osVersion) {
                caps.platform += ' '+target.osVersion;
            }

            if (caps.platform === 'Windows 10' ) {
                caps.platform = 'WINDOWS';
            } else if (caps.platform === 'Windows 8' ) {
                caps.platform = 'WIN8';
            } else if (caps.platform === 'Windows 8.1' ) {
                caps.platform = 'WIN8';
            } else if (caps.platform === 'Windows XP' ) {
                caps.platform = 'XP';
            } else {
                delete caps.platform;
                caps.os = target.osName;
                caps.os_version = target.osVersion;
            }

        } else {
            caps['browserstack.user'] = this.settings.key;
            caps['browserstack.key'] = this.settings.secret;
            if (target.deviceName) {
                caps.device = target.deviceName;
            }

            if (target.osVersion) {
                caps.os_version = target.osVersion;
            }
        }

        caps.name = testName || null;
        caps.key = this.settings.key;
        caps.secret = this.settings.secret;

        caps['browserstack.video'] = this.settings.recordVideo || false;
        caps['browserstack.networkLogs'] = this.settings.networkLogs || false;
        caps['browserstack.debug'] = this.settings.debug || false;

        caps['browserstack:options'] = {
            name: testName || null
        };

        return caps;
    }

    updateOptions(target, options = {}) {
        const url = 'https://' + this.settings.key + ':' + this.settings.secret + '@hub-cloud.browserstack.com/wd/hub';
        options.seleniumUrl = url;
        options.appiumUrl = 'http://hub-cloud.browserstack.com/wd/hub';
        
        options.wdioOpts = {
            user: this.settings.key,
            key: this.settings.secret
        };

        return options;
    }
}