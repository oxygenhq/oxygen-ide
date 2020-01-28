/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export const SEVERITY_WARN = 'WARN';
export const SEVERITY_ERROR = 'ERROR';
export const SEVERITY_FATAL = 'ERROR';
export const SEVERITY_INFO = 'INFO';
export const SEVERITY_DEBUG = 'DEBUG';
export const EVENT_LOG_ENTRY = 'LOG_ENTRY';


export default class ServiceBase {
    static get SEVERITY_FATAL() { return SEVERITY_FATAL; }
    static get SEVERITY_ERROR() { return SEVERITY_ERROR; }
    static get SEVERITY_INFO() { return SEVERITY_INFO; }

    constructor(mainWindow, settings = null) {
        this.observers = [];
        this.mainWindow = mainWindow;
        this.settings = settings;
    }
    getService(name) {
        if (!global.services || typeof(global.services) !== 'object') {
            return null;
        }
        if (global.services.hasOwnProperty(name)) {
            return global.services[name];
        }
        return null;
    }
    subscribe(observer) { 
        this.observers.push(observer);
    }
    unsubscribe(observer) {
        let index = this.observers.indexOf(observer);
        if (index != -1) {
            this.observers.slice(index, 1);
        }
    }
    log(message, severity = SEVERITY_INFO, extra = null) {
        this.notify({
            type: EVENT_LOG_ENTRY,
            severity: severity,
            message: message,
            extra: extra,
        });
    }
    logInfo(message, extra = null) {
        this.log(message, SEVERITY_INFO, extra);
    }
    logError(message, extra = null) {
        this.log(message, SEVERITY_ERROR, extra);
    }
    logDebug(message, extra = null) {
        this.log(message, SEVERITY_DEBUG, extra);
    }
    notify(inputEvent, message = null, severity = SEVERITY_INFO) {
        let event = inputEvent;
        if (typeof(event) == 'string') {
            event = {
                type: event,
                severity: severity,
                message: message,
            };
        }

        for (var o of this.observers) {
            o(event);
        }
    }
    // dispose method must be implemented by inheriting class
    async dispose() {
        for (var observer of this.observers) {
            this.unsubscribe(observer);
        }
    }
}
