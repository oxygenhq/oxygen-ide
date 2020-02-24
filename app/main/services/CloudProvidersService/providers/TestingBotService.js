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
            const MACOS = 'MacOS';
            const YOSEMITE = 'YOSEMITE';
            const CAPITAN = 'CAPITAN';
            const CATALINA = 'CATALINA';
            const MOJAVE = 'MOJAVE';
            const SIERRA = 'SIERRA';
            const HIGH_SIERRA = 'HIGH-SIERRA';
            const MAVERICKS = 'MAVERICKS';
            
            const VISTA = 'VISTA';
            const WIN10 = 'WIN10';
            const WIN8 = 'WIN8';
            const WIN8_1 = 'WIN8_1';
            const XP = 'XP';
            
            if (target.browserName) {
                caps.browserName = target.browserName;
            }

            if (target.browserVersion) {
                caps.browserVersion = target.browserVersion;
            }

            if (target.osName) {
                caps.platform = target.osName;
            }
            
            if (target.osVersion) {
                if(target.osVersion === YOSEMITE){
                    caps.platform = MACOS;
                }
                if(target.osVersion === CAPITAN){
                    caps.platform = CAPITAN;
                }
                if(target.osVersion === CATALINA){
                    caps.platform = CATALINA;
                }
                if(target.osVersion === MOJAVE){
                    caps.platform = MOJAVE;
                }
                if(target.osVersion === SIERRA){
                    caps.platform = SIERRA;
                }
                if(target.osVersion === HIGH_SIERRA){
                    caps.platform = HIGH_SIERRA;
                }
                if(target.osVersion === MAVERICKS){
                    caps.platform = MAVERICKS;
                }

                if(target.osVersion === VISTA){
                    caps.platform = VISTA;
                }
                if(target.osVersion === '10'){
                    caps.platform = WIN10;
                }
                if(target.osVersion === '8_1'){
                    caps.platform = WIN8_1;
                }
                if(target.osVersion === '8'){
                    caps.platform = WIN8;
                }
                if(target.osVersion === XP){
                    caps.platform = XP;
                }
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
        caps['testingBot:options'] = {
            name: testName || null
        };

        return caps;
    }
    updateOptions(target, options = {}) {
        options.seleniumUrl = this.settings.url;
        options.appiumUrl = this.settings.url;
        
        options.wdioOpts = {
            user: this.settings.key,
            key: this.settings.secret
        };

        return options;
    }
}