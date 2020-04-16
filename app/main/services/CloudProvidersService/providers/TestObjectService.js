import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';

export default class TestObjectService extends CloudProviderBase {
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

    async getDevice(id){
        if (this.settings && this.settings.testObjectUsername && this.settings.testobject_api_key) {
            let fetchFn;

            if(typeof fetch === 'function'){
                fetchFn = fetch;
            } else if(fetch && fetch.default && typeof fetch.default === 'function'){
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('TestObject: fetchFn not found');
            }
            
            try{
                const response = await fetchFn(`https://app.testobject.com/api/rest/v2/devices/${id}`,
                {
                    method:'GET',
                    headers: {
                        'Authorization' : 'Basic ' + Buffer.from(this.settings.testObjectUsername + ':' + this.settings.testobject_api_key).toString('base64')
                    },
                });
        
                if (response) {
                    // console.log('response', response);
                    return response.json();
                }
                // not suppose to happen
                return null;
            } catch(e){
                console.log('getDevice e', e);
            }
        }
        else {
            throw new Error('TestObject: invalid credentials');
        }
    }

    async getDevices(){
        
        // console.log('this.settings', this.settings);
        if (this.settings && this.settings.testObjectUsername && this.settings.testobject_api_key) {

            // olejko - username
            // F128DBC77A234AF1991D435A5D07A54B - appium/basic/instructions

            let fetchFn;

            if(typeof fetch === 'function'){
                fetchFn = fetch;
            } else if(fetch && fetch.default && typeof fetch.default === 'function'){
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('TestObject: fetchFn not found');
            }
            
            const response = await fetchFn('https://app.testobject.com/api/rest/v2/devices/available',
            {
                method:'GET',
                headers: {
                    'Authorization' : 'Basic ' + Buffer.from(this.settings.testObjectUsername + ':' + this.settings.testobject_api_key).toString('base64')
                },
            });
            if (response) {
                // console.log('response', response);
                return response.json();
            }
            // not suppose to happen
            return null;
        }
        else {
            throw new Error('TestObject: invalid credentials');
        }
    }
    async getBrowsersAndDevices() {
        let devices = [];
        let devicesPromises = [];

        let devicesIds = await this.getDevices();
        // console.log('~~devicesIds', devicesIds);

        //OELG_TODO region support
        devicesIds = devicesIds['US'];

        // console.log('~~devicesIds', JSON.stringify(devicesIds, null, 2));

        if(devicesIds && Array.isArray(devicesIds) && devicesIds.length > 0){
            devicesPromises = await devicesIds.map(async(item, idx) => {
                
                try {
                    const device = await this.getDevice(item);
    
                    // console.log('~~idx', idx);
                    // console.log('~~device', device);
    
                    //OELG_TODO region support
                    if(device && device['US']) {
                        devices.push(device['US']);
                        return device['US'];
                    }
                } catch(e){
                    console.log('getDevice e', e);
                    return null;
                }
            });
        }
        
        // console.log('~~devices1', devicesPromises);

        await Promise.all(devicesPromises);

        // console.log('~~devices2', Object.keys(devices));

        return {
            devices: devices
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

        if(!this.settings.testObjectUsername){
            throw new Error('"username" must not be null');
        }

        if(!this.settings.testobject_api_key){
            throw new Error('"api_key" must not be null');
        }

        console.log('target', target);

        if (target.osName) {
            caps.platformName = target.osName;

            if(target.osName === 'android'){
                caps.browserName = 'Android';
            } else {
                caps.browserName = 'Safari';
            }
        }

        if (target.deviceName) {
            caps.deviceName = target.deviceName;
        }

        if (target.osVersion) {
            caps.platformVersion = target.osVersion;
        }

        
        caps['testObject:options'] = {
            name: testName || null,
            testobject_api_key: this.settings.testobject_api_key,
        };
        caps.testobject_api_key = this.settings.testobject_api_key;

        return caps;
    }
    updateOptions(target, options = {}) {
        console.log('ssthis.settings', this.settings);
        options.appiumUrl = this.settings.host;
        return options;
    }
}