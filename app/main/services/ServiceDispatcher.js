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
        this.settings = appSettings.getSync('appSettings');
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
            e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: { type: 'SERVICE_NOT_FOUND' } });
            return;     // FIXME: see if we can send back an error message
        }
        let methodRef = serviceRef[method];
        if (!methodRef) {
            e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: { type: 'METHOD_NOT_FOUND' } });
            return;
        }
        if (service !== 'ElectronService' && method !== 'updateCache') {
            console.log(`Service call: ${service}.${method}`, args);
        }
        try {
            const retval = methodRef.apply(serviceRef, args);
            Promise.resolve(retval)
                .then( result => {
                    try {
                        e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, retval: result });
                    } catch (e) {
                        // ignore — frame can be torn down mid-call (e.g. during a dev-mode reload)
                        console.log('sender.send error:', e);
                    }
                })
                .catch( err => {
                    // dont send the raw Error object — IPC structured clone drops custom
                    // properties like .code, keeping only name/message/stack
                    const serializableError = {
                        code: (err && err.code) || null,
                        message: (err && err.message) || null,
                    };
                    try {
                        console.error('MAIN_SERVICE_CALL_REPLY', serializableError);
                        e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: serializableError });
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
            e.sender.send('MAIN_SERVICE_CALL_REPLY', { ...call, error: serializableError });
        }
    }

    _handleServiceEvent(serviceName, event) {
        const allWebContents = webContents.getAllWebContents();
        allWebContents.forEach((contents) => {
            if (contents.isDestroyed() || contents.isCrashed()) {
                return;
            }
            try {
                contents.send('MAIN_SERVICE_EVENT', {
                    service: serviceName,
                    event: event,
                });
            } catch (e) {
                // usually a torn-down frame (e.g. during a dev-mode reload), but can also be
                // an IPC structured-clone failure on non-serializable event data — log so the
                // latter isn't silently swallowed (that would make the event vanish with no trace)
                console.warn(`Failed to send MAIN_SERVICE_EVENT for service "${serviceName}", event type "${event && event.type}":`, e);
            }
        });
    }
}
