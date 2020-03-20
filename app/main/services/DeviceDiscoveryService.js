/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import ADB from 'appium-adb';
import ServiceBase from './ServiceBase';
import * as Sentry from '@sentry/electron';
import { execSync } from 'child_process';
import { exec } from 'teen_process';

const DEVICE_CONNECTED = 'DEVICE_CONNECTED';
const DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED';
const XCODE_ERROR = 'XCODE_ERROR';
const DEVICE_MONITOR_INTERVAL = 10000;
const INST_STALL_TIMEOUT = 16000;

const DEVICE_INFO = {
    os: {
        name: null,
        version: null,
        apiLevel: null
    },
    product: {
        brand: null,
        manufacturer: null,
        model: null,
        code: null
    }
};

export default class DeviceDiscoveryService extends ServiceBase {
    devices = {};
    updatingDeviceList = false;
    devListInterval = null;
    adbPresent = true;
    xCodeNotified = false;

    constructor() {
        super();
    }

    async start() {
        await this._reportADBVersion();
        await this._updateDeviceList();

        const self = this;
        this.devListInterval = setInterval(function() {
            // do not update devices if previous update call is not finished yet
            if (!self.updatingDeviceList) {
                self._updateDeviceList();
            }
        },  DEVICE_MONITOR_INTERVAL);
        
        return this.devices;
    }

    async _reportADBVersion() {
        try {
            const adb = await ADB.createADB();
            const adbVersion = adb.getAdbVersion();
            
            Sentry.configureScope((scope) => {
                scope.setUser({'abdVersion2': adbVersion});
            });

        } catch(e){            
            let message = 'not finded';

            if(e && e.message){
                message += ' ' + e.message;
            }
            
            Sentry.configureScope((scope) => {
                scope.setUser({'abdVersion2': message});
            });
        }
        try {


            const execResult = execSync('adb version');

            if(execResult && execResult.toString){
                const result = execResult.toString().trim();    
                if(result){
                    if(Sentry && Sentry.configureScope){
                        Sentry.configureScope((scope) => {
                            scope.setUser({'abdVersion': result});
                        });
                    }
                } else {

                    console.log('adb version');
                    console.log(execResult);

                    if(Sentry && Sentry.configureScope){
                        Sentry.configureScope((scope) => {
                            scope.setUser({'abdVersion': 'Unknown "adb version" result'});
                        });
                    }
                }
            } else {
                console.log('adb version');
                console.log(execResult);
                

                if(Sentry && Sentry.configureScope){
                    Sentry.configureScope((scope) => {
                        scope.setUser({'abdVersion': 'Unknown "adb version" result'});
                    });
                }
            }
        } catch(e){
            let message = 'not finded';

            if(e && e.message){
                message += ' ' + e.message;
            }

            Sentry.configureScope((scope) => {
                scope.setUser({'abdVersion': message});
            });
        }
    }

    async _updateDeviceList() {
        // prevent duplicated calls to this function
        if (this.updatingDeviceList) {
            return;
        }
        this.updatingDeviceList = true;
        const timestamp = (new Date()).getTime();

        if (this.adbPresent) {
            await this._updateAndroidDevices(timestamp);
        }

        // do not try to retrieve iOS device on Windows and Linux
        if (process.platform === 'darwin') {
            await this._updateIOSDevices(timestamp);
        }
    
        // go through all the devices and see which one is not connected anymore
        var uuids = Object.keys(this.devices);
        for (var i = 0; i < uuids.length; i++) {
            var device = this.devices[uuids[i]];
            if (device.timestamp < timestamp) {
                device.new = false;
                device.connected = false;
                this._emitDeviceDisconnected(device);
            }
            else if (device.new) {
                this._emitDeviceConnected(device);
            }
        }
        this.updatingDeviceList = false;    
    }

    async stop() {
        if (this.devListInterval) {
            clearInterval(this.devListInterval);
            this.devListInterval = null;
        }
    }
    
    async _updateAndroidDevices(timestamp) {
        try {
            let adb = await ADB.createADB();
            const connectedDevices = await adb.getConnectedDevices();
            for (var i = 0; i < connectedDevices.length; i++) {
                const uuid = connectedDevices[i].udid;
                if (!uuid) {
                    continue;
                }
                // previously seen device
                if (this.devices[uuid]) {
                    this.devices[uuid].new = this.devices[uuid].connected == false;
                    this.devices[uuid].connected = true;
                    this.devices[uuid].timestamp = timestamp;
                } else {    // new device
                    // determine if this is a real device or an emulator
                    var isReal = uuid.indexOf('emulator') != 0 && uuid.indexOf(':') == -1;
                    const info = await this._getAndroidDeviceInfo(uuid);
                    // add new device
                    this.devices[uuid] = {
                        new: true,
                        id: uuid,
                        name: `${info.product.model} [${info.os.name} ${info.os.version}]`,
                        connected: true,
                        real: isReal,
                        changed: true,
                        timestamp: timestamp,
                        ios: false,
                        android: true,
                        info: info
                    };
                }
            }
        } catch (e) {
            console.warn('Unable to retrieve Android device list.', e);
            // if adb could not be found then stop the service as there is no point running it again
            if (e.message && e.message.startsWith("Could not find 'adb")) {
                this.adbPresent = false;
            } else {
                Sentry.captureException(e);
            }
        }
    }

    async _getAndroidDeviceInfo(uuid) {
        const adb = await ADB.createADB();
    
        const devInfo = { ...DEVICE_INFO };
        // set device id
        adb.setDeviceId(uuid);
        // platform and version
        devInfo.os.name = 'Android';
        devInfo.os.version = await adb.getPlatformVersion();
        devInfo.os.apiLevel = await adb.getApiLevel();
        // product related
        devInfo.product.brand = await adb.shell(['getprop', 'ro.product.brand']);
        devInfo.product.manufacturer = await adb.shell(['getprop', 'ro.product.manufacturer']);
        devInfo.product.model = await adb.shell(['getprop', 'ro.product.model']);
        devInfo.product.code = await adb.shell(['getprop', 'ril.product_code']);
        devInfo.product.battery = await adb.shell(['dumpsys', 'battery']);

        return devInfo;
    }
    
    async _updateIOSDevices(timestamp) {
        try {
            const connectedDevices = await this._iosGetAvailableDevices();
            for (var i = 0; i < connectedDevices.length; i++) {
                var devInfoStr = connectedDevices[i];
                var info = this._extractIOSDeviceInfo(devInfoStr);
                if (info == null)
                    continue;
                var uuid = info.uuid;
                var realDevice = devInfoStr.indexOf('(Simulator)') == -1;
                var isTablet = devInfoStr.indexOf('iPad') > -1;
                // previously seen device
                if (this.devices[uuid]) {
                    this.devices[uuid].new = this.devices[uuid].connected == false;
                    this.devices[uuid].connected = true;
                    this.devices[uuid].timestamp = timestamp;
                } else {
                    // add new device
                    this.devices[uuid] = {
                        id: uuid,
                        name: `${info.name} [iOS ${info.version}]`,
                        connected: true,
                        new: true,
                        real: realDevice,
                        tablet: isTablet,
                        timestamp: timestamp,
                        ios: true,
                        android: false,
                        info: {
                            name: info.name,
                            os: {
                                name: 'iOS',
                                version: info.version
                            },
                            product: {
                                brand: 'Apple',
                                manufacturer: 'Apple',
                                model: info.name,    // this should give us a unique model id for iOS device
                                code: 'n/a'
                            }
                        }
                    };
                }
            }
        }
        catch (e) {
            if(e && e.message && e.message === 'Could not find the instruments binary. Please ensure `xcrun -find instruments` can locate it.'){
                if(this.xCodeNotified){
                    // ignore
                } else {
                    this.xCodeNotified = true;
                    this.notify({
                        type: XCODE_ERROR,
                    });
                }
            } else {
                Sentry.captureException(e);
            }
        }
    }

    // from https://github.com/appium/appium-ios-driver/blob/master/lib/instruments/utils.js
    async _iosGetInstrumentsPath() {
        let instrumentsPath;
        try {
            let {stdout} = await exec('xcrun', ['-find', 'instruments']);
            instrumentsPath = (stdout || '').trim().replace('\n$', '');
        } catch (err) {
            if (err) {
                console.error(err.message);
            }
        }
        if (!instrumentsPath) {
            throw new Error('Could not find the instruments binary. Please ensure `xcrun -find instruments` can locate it.');
        }
        return instrumentsPath;
    }

    async _iosGetAvailableDevices(timeout = INST_STALL_TIMEOUT) {
        let instrumentsPath = await this._iosGetInstrumentsPath();
        let opts = {timeout};
        let lines;
        try {
            let {stdout} = await exec(instrumentsPath, ['-s', 'devices'], opts);
            lines = stdout.split('\n');
        } catch (err) {
            throw new Error(`Failed getting devices, err: ${err}.`);
        }
        let devices = lines.filter((line) => {
            // https://regex101.com/r/aE6aS3/6
            return /^.+ \(\d+\.(\d+\.)?\d+( Simulator)?\) \[.+\]( \(Simulator\))?$/.test(line);
        });
        return devices;
    }
        
    _emitDeviceConnected(device) {
        this.notify({
            type: DEVICE_CONNECTED,
            device: device,
        });
    }

    _emitDeviceDisconnected(device) {
        this.notify({
            type: DEVICE_DISCONNECTED,
            device: device,
        });
    }

    _delay(timeout, f) {
        return new Promise(function(resolve) {
            setTimeout(resolve.bind(null, f), timeout);
        });
    }

    _extractIOSDeviceInfo(devstr) {
        if (!devstr)
            return null;
        const reDevNameOnly = new RegExp('(.*?) \\((.*?)\\) \\[(.*?)\\]');
        const reDevNamePlusSize = new RegExp('(.+? \\(.+? inch\\)) \\((.+?)\\) \\[(.+?)\\]');
        const reDevNamePlusWatch = new RegExp('(.+?) \\((.+?)\\) \\+ (.+?) \\((.+?)\\) \\[(.+?)\\]');
        var info = {
            name: null,
            version: null,
            uuid: null
        };
        var matches;
        if (devstr.indexOf('inch') > -1) {
            matches = reDevNamePlusSize.exec(devstr);
            if (!matches || matches.length != 4)
                return null;
            info.name = matches[1];
            info.version = matches[2];
            info.uuid = matches[3];
        } else if (devstr.indexOf('+') > -1) {
            matches = reDevNamePlusWatch.exec(devstr);
            if (!matches || matches.length != 6)
                return null;
            info.name = matches[1] + ' + ' + matches[3];
            info.version = matches[2] + ' + ' + matches[4];
            info.uuid = matches[5];
        } else {
            matches = reDevNameOnly.exec(devstr);
            if (!matches || matches.length != 4)
                return null;
            info.name = matches[1];
            info.version = matches[2];
            info.uuid = matches[3];
        }
        return info;
    }
}

