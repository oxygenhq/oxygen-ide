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
    

    async getUser(){

        let errorMessage = 'SauceLabs: invalid credentials';

        if (this.settings && this.settings.username && this.settings.accessKey) {
            
            let fetchFn;

            if(typeof fetch === 'function'){
                fetchFn = fetch;
            } else if(fetch && fetch.default && typeof fetch.default === 'function'){
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('TestObject: fetchFn not found');
            }
            
                
            const response = await fetchFn('https://saucelabs.com/rest/v1/users/'+this.settings.username,
            {
                method:'GET',
                headers: {
                    'Authorization' : 'Basic ' + Buffer.from(this.settings.username + ':' + this.settings.accessKey).toString('base64')
                },
            });
            
            const responseJson = await response.json();
            
            if(
                response &&
                response.status === 404 &&
                responseJson &&
                responseJson.message
            ){
                errorMessage += ' '+responseJson.message;
            }

            if(
                response &&
                response.status === 200 &&
                responseJson &&
                responseJson.username &&
                responseJson.access_key &&
                responseJson.username === this.settings.username &&
                responseJson.access_key === this.settings.accessKey
            ) {
                // ignore, all correct
            } else {
                throw new Error(errorMessage);
            }
        }
        else {
            throw new Error(errorMessage);
        }
    }
    
    async getBrowsersAndDevices() {
        let browsers = [];

        await this.getUser();

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
        options.seleniumUrl = this.settings.url;
        return options;
    }
}