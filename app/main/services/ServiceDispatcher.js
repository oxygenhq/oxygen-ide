/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import Services from './index';
import { webContents, ipcMain } from 'electron';
import appSettings from 'electron-settings';

export default class ServiceDispatcher {
    constructor(mainWindow, settings = null) {
        global.services = this.servicesHash = {};
        this.mainWindow = mainWindow;
        this.settings = appSettings.get('appSettings');
    }

    start() {
        // instanciate all available services
        for (var name in Services) {
            let Service = Services[name];
            let service = new Service(this.mainWindow, this.settings);
            this.servicesHash[name] = service;
            // subscribe to service events
            service.subscribe(this._handleServiceEvent.bind(this, name));
        }
        ipcMain.on('MAIN_SERVICE_CALL', this._handleServiceCall.bind(this));
    }

    async dispose() {
        // dispose all services
        for (var serviceKey of Object.keys(this.servicesHash)) {
            const service = this.servicesHash[serviceKey];
            try {
                await service.dispose();
            }
            catch (e) { // ignore any dispose errors
                console.warn(`Error occured while disposing service: "${serviceKey}"`, e);
            }
        }
    }

    _handleServiceCall(e, call) {
        const { service, method, args } = call;

        let serviceRef = this.servicesHash[service];
        if (!serviceRef) {
            if (e && e.sender && e.sender.send) {
                e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: { type: 'SERVICE_NOT_FOUND' } });
            }
            return;     // FIXME: see if we can send back an error message
        }
        let methodRef = serviceRef[method];
        if (!methodRef) {
            if (e && e.sender && e.sender.send) {
                e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: { type: 'METHOD_NOT_FOUND' } });
            }
            return;
        }
        if (service !== 'ElectronService' && method !== 'updateCache') {
            console.log(`Service call: ${service}.${method}`, args);
        }
        try {
            const retval = methodRef.apply(serviceRef, args);
            Promise.resolve(retval)
                .then( result => {
                    if (e && e.sender && e.sender.send) {
                        e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, retval: result });
                    }
                })
                .catch( err => {
                    try {
                        console.log(err);
                        if (e && e.sender && e.sender.send) {
                            e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: err });
                        }
                    } catch (e) {
                        // to avoid Unhandled Promise Rejection. Error: Object has been destroyed
                        // for example if user close ide when test run
                        console.log('sender.send error:', e);
                    }
                });
        }
        catch (error) {
            // dont send Error object as it's won't be properly serialized
            const serializableError = {
                code : error.code || null,
                message: error.message || null,
            };
            console.log(`Service call error: ${service}.${method}`, serializableError);
            if (e && e.sender && e.sender.send) {
                e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: serializableError });
            }
        }
    }

    _handleServiceEvent(serviceName, event) {
        const allWebContents = webContents.getAllWebContents();
        allWebContents.forEach((contents) => {
            if (contents && contents.send) {
                contents.send('MAIN_SERVICE_EVENT', {
                    service: serviceName,
                    event: event,
                });
            }
        });
    }
}
