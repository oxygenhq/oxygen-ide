/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import http from 'http';
import https from 'https';
import dns from 'dns';
import fs from 'fs';
import path from 'path';
import * as Sentry from '@sentry/electron';

import ServiceBase from './ServiceBase';

const PORT_HTTP = 7778;
const PORT_HTTPS = 8889;

const RECORDER_EVENT = 'RECORDER_EVENT';
const RECORDER_NEW_CAN_RECORD = 'RECORDER_NEW_CAN_RECORD';
const CHROME_EXTENSION_ENABLED = 'CHROME_EXTENSION_ENABLED';
const EXTENSION_CHECK_TIMEOUT = 4500;

const RECORDER_DIR = process.env.NODE_ENV === 'production' ?
                        path.resolve(__dirname, 'services') :
                        path.resolve(__dirname, '.');

export default class RecorderService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
        this.windowGroups = [];
        
        this.lastExtensionTime = Date.now();
        this.intervalId = setInterval(this.timer, EXTENSION_CHECK_TIMEOUT);
    }

    watch() {
        this.start();
    }

    start() {
        // prevent starting the recorder twice
        if (this.httpSrv || this.httpsSrv) {
            return;
        }
        this.httpSrv = http.createServer(::this._onRequest);
        this.httpSrv.on('error', (err) => {
            console.log("Unable to bind recorder's HTTP listener. " + err);
        });

        const options = {
            key: fs.readFileSync(path.join(RECORDER_DIR, 'cloudbeat-key.pem')),
            cert: fs.readFileSync(path.join(RECORDER_DIR, 'cloudbeat-cert.pem')),
            requestCert: false,
            rejectUnauthorized: false
        };

        this.httpsSrv = https.createServer(options, ::this._onRequest);
        this.httpsSrv.on('error', (err) => {
            console.log("Unable to bind recorder's HTTPS listener ", err);
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
            try {
                this.httpSrv.listen(PORT_HTTP, hostname, function() { });
            } catch (e) {
                Sentry.captureException(e);
                console.error('Unable to open ' + hostname + ':' + PORT_HTTP, e);
            }

            try{
                this.httpsSrv.listen(PORT_HTTPS, hostname, function(){ });
            } catch (e){
                console.log('httpsSrv listen e', e);
            }
        });
    }

    stop() {
        if (this.httpSrv) {
            this.httpSrv.close();
            this.httpSrv = null;
        }
        if (this.httpsSrv) {
            this.httpsSrv.close();
            this.httpsSrv = null;
        }
    }

    _onRequest(request, response) {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Headers', '*');
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
                if (request.url === '/lastwin_attach') {
                    if (!self.lastWin) {
                        self.lastWin = body;
                    }
                    
                    response.statusCode = 200;
                    response.statusMessage = 'OK';
                    response.end();
                } else if (request.url === '/lastwin_update') {
                    var tmpLastWin = self.lastWin;
                    self.lastWin = body;

                    // find top window for the previous window
                    var top;
                    for (let group of self.windowGroups) {
                        if (group.indexOf(tmpLastWin) >= 0) {
                            top = group.substring(group.length - 20);
                            break;
                        }
                    }
                    // check whether new window has same top as the previous one
                    var sameGroup = false;
                    for (let group of self.windowGroups) {
                        if (group.indexOf(body) >= 0 && group.indexOf(top) >= 0) {
                            sameGroup = true;
                        }
                    }

                    response.write(JSON.stringify({
                        hash: tmpLastWin ? tmpLastWin : '',
                        sameGroup: sameGroup
                    }));
                    response.end();
                } else if (request.url === '/windowgroup_add') {
                    self.windowGroups.push(body);
                    
                    response.statusCode = 200;
                    response.statusMessage = 'OK';
                    response.end();
                } else {
                    try {
                        self._emit(JSON.parse(body));
                    } catch(e){
                        console.log('body JSON.parse e', e);
                        console.log('body', body);
                    }

                    response.statusCode = 200;
                    response.statusMessage = 'OK';
                    response.end();
                }
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
    
            let stepsArray = [];
            for (var step of steps) {
                const stp = {
                    ...step,
                    module: step.module || 'web',   // use default module (Web) if module name is not returned by recorder extension
                };
                stepsArray.push(stp);
            }
    
            this.notify({
                type: RECORDER_EVENT,
                stepsArray
            });
            
        }, 0);
    }

    timer = () => {
        if (this.lastExtensionTime) {
            let newCanRecord = false;
            const now = Date.now();
            const diff = now - this.lastExtensionTime;
    
    
            if (diff && diff > EXTENSION_CHECK_TIMEOUT ) {
                newCanRecord = false;
            } else {
                newCanRecord = true;
            }

            newCanRecord = true;

            this.notify({
                type: RECORDER_NEW_CAN_RECORD,
                newCanRecord: newCanRecord
            });
        }
    }
}
