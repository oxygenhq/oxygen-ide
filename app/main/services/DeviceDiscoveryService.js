/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import ADB from 'appium-adb';
import ServiceBase from "./ServiceBase";

const DEVICE_CONNECTED = 'DEVICE_CONNECTED';
const DEVICE_DISCONNECTED = 'DEVICE_DISCONNECTED';
const CHECK_INTERVAL = 2000;

export default class DeviceDiscoveryService extends ServiceBase {
    devices = {};

    constructor() {
        super();
    }

    start() {
        // limit the number of retries in order to prevent console spamming when adb is not installed for example
        this.retries = 5;
        this._getConnectedDevices();
    }

    async stop() {
        // FIXME: should cancel the timeout
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
        var self = this;
        return new Promise(function(resolve) {
            setTimeout(resolve.bind(null, f), timeout)
        });
    }

    _getConnectedDevices() {
        var self = this;
        ADB.createADB().then((adb) => {
            adb.getConnectedDevices().then((devices) => {
                const currentDevices = {};
                // notify about any new device
                for (const dev of devices) {
                    if (!self.devices[dev.udid]) {
                        self._emitDeviceConnected({ id: dev.udid });
                    }
                    currentDevices[dev.udid] = true;
                }

                // notify about removed devices
                for (const oldDev in self.devices) {
                    if (!currentDevices[oldDev]) {
                        self._emitDeviceDisconnected({ id: oldDev });
                    }
                }

                self.devices = currentDevices;

                return self._delay(CHECK_INTERVAL).then(function() {
                    return self._getConnectedDevices();
                });
            })
            .catch((e) => {
                console.debug(e);
                if (self.retries-- === 0) {
                    Promise.resolve();
                }
                return self._delay(CHECK_INTERVAL).then(function() {
                    return self._getConnectedDevices();
                });
            })
        })
        .catch((e) => {
            console.debug(e);
            if (self.retries-- === 0) {
                return Promise.resolve();
            }
            return self._delay(CHECK_INTERVAL).then(function() {
                return self._getConnectedDevices();
            });
        });
    }
}
