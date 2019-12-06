import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';

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
            const response = await fetch('https://api.lambdatest.com/automation/api/v1/platforms',
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
            }

            if (target.osName) {
                caps.osName = target.osName;
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
        
        caps.name = testName || null;
        caps.build = this.settings.build || null;
        caps.console = this.settings.captureConsole || false;
        caps.network = this.settings.captureNetwork || false;
        caps.visual = this.settings.takeScreenshots || false;
        caps.video = this.settings.videoRecording || false;

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        
        options.wdioOpts = {
            user: this.settings.user,
            key: this.settings.key
        };

        return options;
    }
}