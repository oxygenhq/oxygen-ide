import CloudProviderBase from '../CloudProviderBase';
import fetch from 'node-fetch';
import parser from 'xml2json';

export default class PerfectoMobileService extends CloudProviderBase {
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

    async getDevices(){
        if (this.settings && this.settings.host && this.settings.securityToken) {

            let fetchFn;

            if(typeof fetch === 'function'){
                fetchFn = fetch;
            } else if(fetch && fetch.default && typeof fetch.default === 'function'){
                fetchFn = fetch.default;
            } else {
                console.log('fetchFn not found');
                throw new Error('TestObject: fetchFn not found');
            }
            
            const response = await fetchFn(`${this.settings.host}/services/handsets?operation=list&securityToken=${this.settings.securityToken}&status=connected`,
            {
                method:'GET'
            });
            if (response) {
                return response.text();
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

        const devicesXml = await this.getDevices();

        const devicesJson = parser.toJson(devicesXml, {object: true});
        
        if(
            devicesJson &&
            devicesJson.handsets &&
            devicesJson.handsets.handset &&
            Array.isArray(devicesJson.handsets.handset) &&
            devicesJson.handsets.handset.length > 0
        ){
            devices = devicesJson.handsets.handset;
        }

        this.devices = devices;

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

        if(!this.settings.host){
            throw new Error('"host" must not be null');
        }

        if(!this.settings.securityToken){
            throw new Error('"securityToken" must not be null');
        }

        if (target.osName) {
            caps.platformName = target.osName;
        }

        if(target.deviceName){
            caps.manufacturer = target.deviceName;
        }

        if (target.osVersion) {
            caps.model = target.osVersion;
        }

        
        if(caps.manufacturer === 'iPhone'){
            caps.manufacturer = 'Apple';
            caps.model = target.deviceName+'-'+target.osVersion;
        }
        if(caps.manufacturer === 'iPad'){
            caps.manufacturer = 'Apple';
            caps.model = target.deviceName+' '+target.osVersion;
        }

        if(
            caps.model &&
            this.devices &&
            Array.isArray(this.devices) &&
            this.devices.length > 0
        ){
            const device = this.devices.find((item) => item.model === caps.model);

            if(device){
                caps.deviceName = device.deviceId;
            }
        }

        caps['perfectoMobile:options'] = {
            name: testName || null
        };
        caps.securityToken = this.settings.securityToken;
        caps.host = this.settings.host;

        return caps;
    }
    updateOptions(target, options = {}) {
        options.appiumUrl = this.settings.host;
        return options;
    }
}