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

        // add BrowserStack options object
        const bstackOpts = caps['bstack:options'] = {};
        // set user credentials
        bstackOpts.userName = this.settings.key;
        bstackOpts.accessKey = this.settings.secret;
        // run test on a browser
        if (target && target.browserName) {
            
            if (target.browserName) {
                caps.browserName = target.browserName;
            }

            if (target.browserVersion) {
                caps.browserVersion = target.browserVersion;
            }

            if (target.osName) {
                bstackOpts.os = target.osName;
            }
            
            if (target.osVersion) {
                bstackOpts.osVersion = target.osVersion;
            }

        } 
        // run test on a mobile device
        else if (target) {
            if (target.deviceName) {
                bstackOpts.deviceName = target.deviceName;
                bstackOpts.realMobile = true;
            }

            if (target.osVersion) {
                bstackOpts.osVersion = target.osVersion;
            }
        }
        // set additional options
        bstackOpts.video = this.settings.recordVideo || false;
        bstackOpts.networkLogs = this.settings.networkLogs || false;
        bstackOpts.debug = this.settings.debug || false;
        bstackOpts.local = this.settings.local || false;
        if (this.settings.build) {
            bstackOpts.buildName = this.settings.build;
        }
        bstackOpts.sessionName = testName || null;
        bstackOpts.idleTimeout = 300;

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