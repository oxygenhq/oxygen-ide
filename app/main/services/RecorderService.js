/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import http from 'http';
import dns from 'dns';
import * as Sentry from '@sentry/electron';

import ServiceBase from './ServiceBase';

const PORT_HTTP = 7778;

const RECORDER_EVENT = 'RECORDER_EVENT';
const RECORDER_NEW_CAN_RECORD = 'RECORDER_NEW_CAN_RECORD';
const CHROME_EXTENSION_ENABLED = 'CHROME_EXTENSION_ENABLED';
const EXTENSION_CHECK_TIMEOUT = 4500;

export default class RecorderService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
        this.windowGroups = [];
        
        this.lastExtensionTime = 0;
        this.intervalId = setInterval(this.timer, EXTENSION_CHECK_TIMEOUT);
    }

    watch() {
        this.start();
    }

    start() {
        // prevent starting the recorder twice
        if (this.httpSrv) {
            return;
        }
        this.httpSrv = http.createServer(::this._onRequest);
        this.httpSrv.on('error', (err) => {
            console.log("Unable to bind recorder's HTTP listener. " + err)
        });

        // here be horrors...
        // 'localhost' might be unavailable in certain situations
        // TODO: figure out a proper solution for this since this doesn't support IPv6
        //       and we can't just bind on 0.0.0.0 for security reasons
        //       and... browser extensions use 'localhost' to connect
        dns.lookup('localhost', (err, addr, family) => {
            var hostname;
            if (!err) { // not resolvable - use IPv4 loopback
                hostname = '127.0.0.1';
            } else if (family == 4 && addr !== '127.0.0.1') { // resolves to something other than 127.0.0.1
                hostname = '127.0.0.1';
            } else {
                hostname = 'localhost';
            }
            try{
                this.httpSrv.listen(PORT_HTTP, hostname, function(){ });
            } catch (e){
                Sentry.captureException(e);
                console.error('Unable to open ' + hostname + ':' + PORT_HTTP, e);
            }
        });
    }

    stop() {
        if (this.httpSrv) {
            this.httpSrv.close();
            this.httpSrv = null;
        }
    }

    _onRequest(request, response) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader("Access-Control-Allow-Headers", "*");
        // disable keep-alive. 
        // otherwise connection pooling might prevent the recorder stopping in a timely manner.
        response.setHeader('Connection', 'close');
        const self = this;

        if (request.method === 'GET') {
            if (request.url === '/ping') {
                this.notify({
                    type: CHROME_EXTENSION_ENABLED
                });
                response.statusCode = 200;
                response.statusMessage = 'OK';
                
                this.lastExtensionTime = Date.now();
            } else {
                response.statusCode = 404;
                response.statusMessage = 'Not found';
            }
            response.end();
        } else if (request.method === 'POST') {
            var body = '';
            request.on('data', function (data) {
                body += data;
            });

            request.on('end', function () {
                response.end();
                setTimeout(function() {
                    self._emit(JSON.parse(body));

                    // For stress test
                    // for(var i = 1; i < 500; i++){
                    //     setTimeout(function(i) {
                    //         return function() { 
                    //             self._emit(JSON.parse(body));
                    //         }
                    //     }(i), 100);
                    // }
                }, 100);
            });
        } else if (request.method === 'OPTIONS') {
            response.statusCode = 200;
            response.statusMessage = 'OK';
            response.end();
        } else {
            response.statusCode = 404;
            response.statusMessage = 'Not found';
            response.end();
        }
    }

    _emit = (steps) => {
        setTimeout(() => {
    
            let stepsArray = []
            for (var step of steps) {
                const stp = {
                    ...step,
                    module: step.module || 'web',   // use default module (Web) if module name is not returned by recorder extension
                }
                stepsArray.push(stp);
            }
    
            const notifyResult = this.notify({
                type: RECORDER_EVENT,
                stepsArray
            });
            
        }, 0);
    }

    timer = () => {
        if(this.lastExtensionTime){
            let newCanRecord = false;
            const now = Date.now();
            const diff = now - this.lastExtensionTime;
    
    
            if(diff && diff > EXTENSION_CHECK_TIMEOUT ){
                newCanRecord = false;
            } else {
                newCanRecord = true;
            }


            this.notify({
                type: RECORDER_NEW_CAN_RECORD,
                newCanRecord: newCanRecord
            });
        }
    }
}
