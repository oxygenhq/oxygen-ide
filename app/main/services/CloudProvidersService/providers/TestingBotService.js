import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';

export default class TestingBotProvider extends CloudProviderBase {
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

    getDevices(){
        return new Promise((resolve, reject) => {
            return fetch('https://api.testingbot.com/v1/devices')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }

    getBrowsers(){
        return new Promise((resolve, reject) => {
            return fetch('https://api.testingbot.com/v1/browsers')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }
    
    async getBrowsersAndDevices() {
        let devices = [];
        let browsers = [];

        devices = await this.getDevices();
        browsers = await this.getBrowsers();

        return {
            devices: devices,
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
        caps.key = this.settings.key;
        caps.secret = this.settings.secret;

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        return options;
    }
}