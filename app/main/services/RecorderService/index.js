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
import fs from 'fs';
import path from 'path';
import dns from 'dns';

import ServiceBase from "../ServiceBase";
import * as Const from '../../../const';

const PORT_HTTP = 7778;
const PORT_HTTPS = 8889;

const RECORDER_DIR = process.env.NODE_ENV === 'production' ?
                        path.resolve(__dirname, 'services', 'RecorderService') :
                        path.resolve(__dirname, '.');
const RECORDER_EVENT = 'RECORDER_EVENT';
const CHROME_EXTENSION_ENABLED = 'CHROME_EXTENSION_ENABLED';

export default class RecorderService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
        this.windowGroups = [];
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
            console.log("Unable to bind recorder's HTTP listener. " + err)
        });

        var options = {
            key: fs.readFileSync(path.join(RECORDER_DIR, 'cloudbeat-key.pem')),
            cert: fs.readFileSync(path.join(RECORDER_DIR, 'cloudbeat-cert.pem')),
            requestCert: false,
            rejectUnauthorized: false
        };
        this.httpsSrv = https.createServer(options, ::this._onRequest);
        this.httpsSrv.on('error', (err) => {
            console.log("Unable to bind recorder's HTTPS listener " + err)
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
                console.log('#71 e', e);
            }
            try{
                this.httpsSrv.listen(PORT_HTTPS, hostname, function(){ });
            } catch (e){
                console.log('#76 e', e);
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
                } else if (request.url === '/lastwin_update') {
                    var tmpLastWin = self.lastWin;
                    self.lastWin = body;

                    // find top window for the previous window
                    var top;
                    for (var group of self.windowGroups) {
                        if (group.indexOf(tmpLastWin) >= 0) {
                            top = group.substring(group.length - 20);
                            break;
                        }
                    }
                    // check whether new window has same top as the previous one
                    var sameGroup = false;
                    for (var group of self.windowGroups) {
                        if (group.indexOf(body) >= 0 && group.indexOf(top) >= 0) {
                            sameGroup = true;
                        }
                    }

                    response.write(JSON.stringify({
                        hash: tmpLastWin ? tmpLastWin : '',
                        sameGroup: sameGroup
                    }));
                } else if (request.url === '/windowgroup_add') {
                    self.windowGroups.push(body);
                } else {
                    self._emit(JSON.parse(body));
                }
                response.end();
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

    _notify(step) {
        this.notify({
            type: RECORDER_EVENT,
            ...step,
            module: step.module || 'web',   // use default module (Web) if module name is not returned by recorder extension
        });
    }

    _emit(steps) {
        for (var step of steps) {
            this._notify(step);
       }
    }
}
