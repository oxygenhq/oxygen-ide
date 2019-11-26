/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { ipcRenderer } from 'electron';
import uniqid from 'uniqid';

export const MAIN_SERVICE_EVENT = 'MAIN_SERVICE_EVENT';
export const MAIN_MENU_EVENT = 'MAIN_MENU_EVENT';
export const MAIN_SERVICE_LOG = 'MAIN_SERVICE_LOG';

export default class MainIpcService {
    static get MAIN_SERVICE_EVENT() { return MAIN_SERVICE_EVENT; }
    static get MAIN_SERVICE_LOG() { return MAIN_SERVICE_LOG; }

    requests = [];
    store = null;

    constructor(store) {
        this.store = store || null;

        // handle Main service calls reply
        ipcRenderer.on('MAIN_SERVICE_CALL_REPLY', this._handleServiceCallReply.bind(this));

        // handle Main service events
        ipcRenderer.on('MAIN_SERVICE_EVENT', this._handleServiceEvent.bind(this));

        // bind public methods to 'this'
        this.call = this.call.bind(this);
        this.bind = this.bind.bind(this);
    }

    bind(store, action$) {
        this.store = store;
        this.action$ = action$;
    }

    call(service, method, args) {
        let _this = this;
        const id = uniqid(); //(new Date()).getTime();

        /* eslint-disable */
        let promise = new Promise((resolve, reject) => {
            try {
                ipcRenderer.send('MAIN_SERVICE_CALL', {
                    id: id,
                    service: service,
                    method: method,
                    args: args || [],
                });
            }
            catch (e) { 
                // if(window && window.Sentry && window.Sentry.captureException){
                //     window.Sentry.captureException(e);
                // }
                reject(e); 
            }

            _this.requests[id] = { resolve, reject };
        });
        /* eslint-enable */
        
        return promise;
    }

    _handleServiceCallReply(e, reply) {
        // find the request's promise by request id
        let promise = this.requests[reply.id];
        if (!promise) {
            return;
        }
        // call the promise either with the result or an error
        if (reply.error) {
            promise.reject(reply.error);
        }
        else {
            promise.resolve(reply.retval);
        }
        // remove promise from the requests list
        delete this.requests[reply.id];
    }

    _handleServiceEvent(e, event) {
        if (!this.store || !event) {
            return;
        }
        if (event && event.event && event.event.type === 'RECORDER_EVENT') {
            this.store.dispatch({
                type: 'RECORDER_SERVICE_ADD_STEP',
                payload: { ...event },
            });    
        }
        else if (event && event.event && event.event.type === 'RECORDER_NEW_CAN_RECORD') {
            this.store.dispatch({
                type: 'RECORDER_NEW_CAN_RECORD',
                payload: { ...event },
            });    
        }
        
        else if (event.type === 'LOG_ENTRY') {
            this.store.dispatch({
                type: 'MAIN_SERVICE_LOG',
                payload: { ...event },
            });    
        }
        // dispatch MAIN_MENU_CMD events directly, without MAIN_SERVICE_EVENT wrap up
        else if (event.event.type === 'MAIN_MENU_CMD') {
            this.store.dispatch({
                type: 'MAIN_MENU_EVENT',
                payload: { cmd: event.event.cmd, args: event.event.args },
            });  
        }
        else {
            this.store.dispatch({
                type: 'MAIN_SERVICE_EVENT',
                payload: { ...event },
            });
        }
    }
}
