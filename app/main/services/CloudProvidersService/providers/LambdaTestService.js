import CloudProviderBase from '../CloudProviderBase';
const fetch = require('node-fetch');

export default class LambdaTestService extends CloudProviderBase {
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

    async getBrowsersAndDevices() {
        if (this.settings && this.settings.user && this.settings.key) {
            const headers = new fetch.Headers();

            headers.set('Authorization', 'Basic ' + Buffer.from(this.settings.user + ':' + this.settings.key).toString('base64'));
            
            let fetchFn;

            if(typeof fetch === 'function'){
                fetchFn = fetch;
            } else if(fetch && fetch.default && typeof fetch.default === 'function'){
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('LambdaTestService: fetchFn not found');
            }

            const response = await fetchFn('https://api.lambdatest.com/automation/api/v1/platforms',
            {
                method:'GET',
                headers: headers,
            });
            if (response) {
                return response.json();
            }
            // not suppose to happen
            return null;
        } 
        else {
            throw new Error('LambdaTestService: invalid credentials');
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
        }
        caps.name = testName || null;
        caps.username = this.settings.username;
        caps.accessKey = this.settings.accessKey;
        caps.extendedDebugging = this.settings.extendedDebugging || false;
        caps.capturePerformance = this.settings.capturePerformance || false;
        caps.build = this.settings.build || null;
        caps.console = this.settings.captureConsole || false;
        caps.network = this.settings.captureNetwork || false;
        caps.visual = this.settings.takeScreenshots || false;
        caps.video = this.settings.videoRecording || false;

        caps['lamda:options'] = {
            name: testName || null
        };

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        options.appiumUrl = this.settings.url;
        
        options.wdioOpts = {
            user: this.settings.user,
            key: this.settings.key
        };

        return options;
    }
}