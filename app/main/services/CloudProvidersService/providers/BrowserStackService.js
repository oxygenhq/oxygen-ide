import CloudProviderBase from '../CloudProviderBase';
const fetch = require('node-fetch');
const browserstack = require('browserstack-local');


export default class BrowserStackService extends CloudProviderBase {
    constructor(settings) {
        super(settings);
        this.isRunning = false;
        this.bsLocal = null;
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
                // bstackOpts.deviceName = target.deviceName;
                caps['appium:deviceName'] = target.deviceName;
                bstackOpts.realMobile = true;
            }

            if (target.osVersion) {
                // bstackOpts.osVersion = target.osVersion;
                caps['appium:platformVersion'] = target.osVersion;
            }

            if (target.osName) {
                if (target.osName === 'android') {
                    caps.platformName = 'Android';
                    caps['appium:automationName'] = 'UIAutomator2';
                }
                else if (target.osName === 'ios') {
                    caps.platformName = 'iOS';
                    caps['appium:automationName'] = 'XCUITest';
                }
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

    async onBeforeTest(caps, options, reporter) {
        if (this.settings.local && this.settings.localAutoStart) {
            await this.startLocalService(this.settings.localForce || false);
        }
    }

    async onAfterTest(err) {
        if (this.settings.local) {
            await this.stopLocalService();
        }
    }

    async startLocalService(force = false) {
        // creates an instance of Local
        this.bsLocal = new browserstack.Local();

        // replace <browserstack-accesskey> with your key. You can also set an environment variable - "BROWSERSTACK_ACCESS_KEY".
        const bs_local_args = {
            'key': this.settings.secret,
            'force': force,
        };

        return new Promise((resolve, reject) => {
            // starts the Local instance with the required arguments
            this.bsLocal.start(bs_local_args, function(error) {
                if (!error) {
                    resolve();
                }
                else {
                    reject(error);
                }
            });
        });
    }

    async stopLocalService() {
        if (!this.bsLocal) {
            return;
        }
        return new Promise((resolve, reject) => {
            // stop the Local instance
            this.bsLocal.stop(function() {
                resolve();
            });
            this.bsLocal = null;
        });        
    }
}