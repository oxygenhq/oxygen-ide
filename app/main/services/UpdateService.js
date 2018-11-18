/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import https from 'https';
import ServiceBase from "./ServiceBase";
import pkgInfo from '../../../package.json';

const UPDATE_CHECK = 'UPDATE_CHECK';

export default class UpdateService extends ServiceBase {
    constructor() {
        super();
    }

    start(notifyIfNoUpdate = false) {
        this._checkForUpdate(notifyIfNoUpdate);
    }

    _checkForUpdate(notifyIfNoUpdate) {
        const getLatestReleaseDetails = (onResult) => {
            var options = {
                host: 'api.github.com',
                port: 443,
                path: '/repos/oxygenhq/oxygen-ide/releases/latest',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'user-agent': 'node.js'
                }
            };

            var req = https.request(options, (res) => {
                var output = '';
                res.setEncoding('utf8');

                res.on('data', (chunk) => {
                    output += chunk;
                });

                res.on('end', () => {
                    var obj = JSON.parse(output);
                    onResult(res.statusCode, obj);
                });
            });

            req.on('error', (err) => {
                onResult(null, err);
            });

            req.end();
        };

        getLatestReleaseDetails((status, response) => {
            if (status == 200 && response) {
                var result = parseResponse(response);
                if (isNewer(result.version, pkgInfo.version)) {
                    var url = getDownloadUrl(result.downloads);
                    this.notify({
                        type: UPDATE_CHECK,
                        version: result.version,
                        url: url
                    });
                } else if (notifyIfNoUpdate) {
                    this.notify({
                        type: UPDATE_CHECK
                    });
                }
            } else {
                const errMsg = response && response.message ? response.message : (response && response.Error ? response.Error : '');
                console.warn(`Failure checking for updates: ${errMsg}`);
            }
        });

        const parseResponse = (json) => {
            var res = {
                version: json.tag_name,
                notes: json.body
            };

            res.downloads = [];
            if (json.assets.length > 0) {
                json.assets.forEach((asset) => { res.downloads.push(asset.browser_download_url); });
            }

            return res;
        };

        const isNewer = (latest, current) => {
            var c = current.split('.');
            var majc = parseInt(c[0]);
            var minc = parseInt(c[1]);
            var ptcc = parseInt(c[2]);
            var l = latest.split('.');
            var majl = parseInt(l[0]);
            var minl = parseInt(l[1]);
            var ptcl = parseInt(l[2]);
            return majl > majc || (minl > minc && majl >= majc) || (ptcl > ptcc && majl >= majc && minl >= minc);
        };

        const getDownloadUrl = (downloads) => {
            var platform;
            switch (process.platform) {
                case 'win32':
                    platform = 'win'; break;
                case 'darwin':
                    platform = 'osx'; break;
                case 'linux':
                default:
                    platform = 'linux'; break;
            }

            var pkg = platform  + '-' + process.arch;

            for (var download of downloads) {
                if (download.indexOf(pkg) > 0) {
                    return download;
                }
            }
        }
    }
}
