/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';
import cp from 'child_process';
import detectPort from 'detect-port';
import { app } from 'electron';
import * as chromeFinder from './chrome-finder';
import * as edgeFinder from './edge-finder';
import { exec } from 'teen_process';
import fs from 'fs-extra';
import tmp from 'tmp';
import extract from 'extract-zip';
import { versions } from './chromedriver-versions.json';
import { edgeVersions } from './edgedriver-versions.json';
import fetch from 'node-fetch';
import ServiceBase from '../ServiceBase';
import glob from 'glob';

import cfg from '../../config.json';
const selSettings = cfg.selenium;

// Events
const ON_SELENIUM_STARTED = 'SELENIUM_STARTED';
const ON_SELENIUM_STOPPED = 'SELENIUM_STOPPED';
const ON_CHROME_DRIVER_ERROR = 'ON_CHROME_DRIVER_ERROR';
const ON_FINDED_CHROME_DRIVER_VERSION = 'ON_FINDED_CHROME_DRIVER_VERSION';
const ON_EDGE_FINDED = 'ON_EDGE_FINDED';
const CHROMEDRIVER_FOLDER_START = 'chromedriver-';
// chrome < 115
const CHROMEDRIVER_PRE_115_API_URL = 'https://chromedriver.storage.googleapis.com';
// chrome >= 115
const CHROMEDRIVER_API_URL = 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';
const CHROMEDRIVER_DOWNLOAD_URL = 'https://edgedl.me.gvt1.com/edgedl/chrome/chrome-for-testing';

// some info about edge drivers 
// https://msedgewebdriverstorage.z22.web.core.windows.net/
// https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver?delimiter=%2F&restype=container&comp=list&_=1606214015871&timeout=60000
// https://msedgedriver.azureedge.net/87.0.626.0/edgedriver_win64.zip
// https://msedgedriver.azureedge.net/87.0.626.0/edgedriver_win32.zip
// https://msedgedriver.azureedge.net/89.0.711.0/edgedriver_mac64.zip

const EDGE_FOLDER_START = 'edgedriver-';
const ON_EDGE_DRIVER_ERROR = 'ON_EDGE_DRIVER_ERROR';
const EDGE_BASE_URL = 'https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver';
const EDGE_DOWNLOAD_DRIVER_URL = 'https://msedgedriver.azureedge.net';

export default class SeleniumService extends ServiceBase {

    constructor() {
        super();

        this.seleniumProc = null;
        this.availablePort = null;

        this.downloadChromeDriver = this.downloadChromeDriver.bind(this);
        this.downloadEdgeDriver = this.downloadEdgeDriver.bind(this);
    }

    async start() {
        return await this._detectPortAndStart();
    }

    _detectPortAndStart() {
        return detectPort(selSettings.port)
            .then(availablePort => {
                const seleniumPid = this._startProcess(availablePort);
                this.availablePort = availablePort;
                return seleniumPid;
            })
            .catch(err => {
                const result = 'Unable to start Selenium';
                console.log(result, err);
                return null;
            });
    }

    stop() {
        if (this.seleniumProc) {
            this.seleniumProc.kill();
            // sending SIGTERM doesn't seem to kill on Windows
            // so we do it through WMIC
            this._killSelenium();
            this.seleniumProc = null;
        }
    }

    dispose() {
        this.stop();
        this._killSelenium();
    }

    _emitStoppedEvent(failed, msg) {
        this.notify(
            ON_SELENIUM_STOPPED,
            msg,
            (failed ? ServiceBase.SEVERITY_ERROR : ServiceBase.SEVERITY_INFO),
        );
    }

    _emitStartedEvent({port, browserTimeout, timeout}) {
        console.log('_emitStartedEvent', port);

        this.notify({
            type: ON_SELENIUM_STARTED,
            port: port,
            timeout: timeout,
            browserTimeout: browserTimeout
        });
    }

    _emitLogEvent(message, severity) {
        this.log(
            message,
            severity,
        );
    }

    _killSelenium() {
        if (process.platform === 'win32') {
            try {
                const cmd = `wmic process where "CommandLine like '%java%-jar%${selSettings.jar}%-port ${this.availablePort}%'" Call Terminate`;
                cp.execSync(cmd, { stdio: 'pipe' });
            } catch (e) {
                console.warn('Failed to kill selenium: ' + e);
            }
        } else {
            try {
                cp.execSync(`pkill -f "/java -jar.*-port ${this.availablePort}/"`, { stdio: 'pipe' });
            } catch (e) {
                // ignore. pkill returns 1 status if process doesn't exist
            }
        }
    }

    async edgeStart() {
        var edgeDriver;
        let edgeVersion;
        try {
            const edgeDetails = await this.getEdgeVersion();
            edgeVersion = edgeDetails.version;
            console.log('Found Edge version: ', edgeVersion);

            if (edgeVersion) {
                this.notify({
                    type: ON_EDGE_FINDED,
                    path: edgeDetails.path
                });
            }

            var edgeDriverVersion = await this.getEdgeDriverVersion(edgeVersion);
            console.log('Required EdgeDriver version: ', edgeDriverVersion);

            edgeDriver = await this.findLocalEdgeDriver(edgeDriverVersion);
            if (edgeDriver) {
                console.log('Found matching EdgeDriver at ', edgeDriver);
            } else {
                throw new Error('Cannot find it localy');
            }
        } catch (e) {
            if (process.platform === 'linux') {
                console.log('Failure setting up EdgeDriver: Edge is not supported on Linux.');
                return null;
            }

            console.warn('Failure setting up EdgeDriver.', e);
            // if something bad happens, check if user has placed the driver manually
            // getEdgeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            edgeDriver = await this.getEdgeDriverBinPathExact();
            if (edgeDriver) {
                console.log('Using user placed EdgeDriver from ' + edgeDriver);
            } else {
                // if no user placed driver then use, the latest bundled version
                edgeDriver = await this.findLocalEdgeDriver(edgeVersions[0].driverVersion);
                if (edgeDriver) {
                    console.log('Using latest bundled EdgeDriver from ' + edgeDriver);
                } else {
                    if (edgeVersion) {
                        this.notify({
                            type: ON_EDGE_DRIVER_ERROR,
                            edgeVersion: edgeDriverVersion
                        });
                    }
                }
            }
        }
        return edgeDriver;
    }

    // used to display required driver version to the user
    async findChromeDriverVersion() {
        try {
            const chromeVersion = await this.getChromeVersion();
            const chromeMajVersion = chromeVersion.split('.')[0];

            const chromeDriverVersion = chromeMajVersion < 115 ? 
                await this.getChromeDriverPre115Version(chromeMajVersion) :
                await this.getChromeDriverVersion(chromeVersion);

            this.notify({
                type: ON_FINDED_CHROME_DRIVER_VERSION,
                chromeVersion: chromeDriverVersion
            });
        } catch (e) {
            this.notify({
                type: ON_FINDED_CHROME_DRIVER_VERSION
            });
        }
    }

    async chromeStart() {
        var chromeDriverPath;
        let chromeDriverVersion;
        try {
            const chromeVersion = await this.getChromeVersion();
            const chromeMajVersion = chromeVersion.split('.')[0];
            console.log('Found Chrome version: ' + chromeMajVersion);

            chromeDriverVersion = chromeMajVersion < 115 ? 
                await this.getChromeDriverPre115Version(chromeMajVersion) :
                await this.getChromeDriverVersion(chromeVersion);

            console.log('Required ChromeDriver version: ' + chromeDriverVersion);
            chromeDriverPath = await this.findLocalChromeDriver(chromeDriverVersion);
            if (chromeDriverPath) {
                console.log('Found matching ChromeDriver at ' + chromeDriverPath);
            } else {
                throw new Error('Cannot find it localy');
            }
        } catch (e) {
            console.warn('Failure setting up ChromeDriver.', e);
            // if something bad happens, check if user has placed the driver manually
            // getChromeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            chromeDriverPath = await this.getChromeDriverBinPathExact();
            if (chromeDriverPath) {
                console.log('Using user placed ChromeDriver from ' + chromeDriverPath);
            } else {
                // if no user placed driver then use, the latest bundled version
                chromeDriverPath = await this.findLocalChromeDriver(versions[0].driverVersion);
                if (chromeDriverPath) {
                    console.log('Using latest bundled ChromeDriver from ' + chromeDriverPath);
                } else {
                    this.notify({
                        type: ON_CHROME_DRIVER_ERROR,
                        chromeVersion: chromeDriverVersion
                    });
                }
            }
        }
        return chromeDriverPath;
    }

    async _startProcess(port) {
        let cwd;
        if (process.env.NODE_ENV === 'production') {
            cwd = path.resolve(__dirname, process.env.RELEASE_BUILD ? '../../app.asar.unpacked/main/selenium' : 'selenium');
        } else {
            cwd = path.resolve(__dirname, '..', '..', 'selenium');
        }

        await this.copyBundledDrivers(cwd);

        const edgeDriverPath = await this.edgeStart();
        const chromeDriverPath = await this.chromeStart();

        const selArgs = [selSettings.jar].concat(selSettings.args);
    
        selArgs.push('standalone');

        let geckodriverPath = null;
    
        if (process.platform === 'win32') {
            geckodriverPath = 'win32/geckodriver.exe';
        } else if (process.platform === 'darwin') {
            geckodriverPath = 'darwin/geckodriver';
        } else {
            geckodriverPath = 'linux/geckodriver';
        }
    
        if (chromeDriverPath) {
            selArgs.unshift(`-Dwebdriver.chrome.driver="${chromeDriverPath}"`);
        }
        if (edgeDriverPath) {
            selArgs.unshift(`-Dwebdriver.edge.driver="${edgeDriverPath}"`);
        }
        selArgs.unshift(`-Dwebdriver.gecko.driver="${geckodriverPath}"`);
    
        if (process.platform === 'win32') {
            selArgs.unshift('-Dwebdriver.ie.driver=win32/IEDriverServer_x86.exe');
        }
        selArgs.push('--port');
        selArgs.push(port.toString());
        selArgs.unshift('-jar');

        selArgs.push('--session-timeout');
        selArgs.push(selSettings.sessionTimeout);

        selArgs.push('--override-max-sessions');
        selArgs.push('true');

        selArgs.push('--max-sessions');
        selArgs.push(selSettings.maxSessions);
        
        console.log('Attempting to start Selenium process with the following args:', selArgs);
        this.seleniumProc = cp.spawn('java', selArgs, { cwd, shell: true });

        let seleniumPid = null;

        if (this.seleniumProc && this.seleniumProc.pid) {
            seleniumPid = this.seleniumProc.pid;
        }

        // FIXME: browserTimeout is not needed in Selenium 4 and should be cleaned up (also from oxygen-cli)
        this._emitStartedEvent({
            port: port,
            browserTimeout: selSettings.browserTimeout,
            timeout: selSettings.sessionTimeout
        });

        this._handleProcessEvents();

        return seleniumPid;
    }

    _handleProcessEvents() {
        const proc = this.seleniumProc;
        if (!proc) {
            console.log('Selenium process was not started.');
            return;
        }
        // on 'error'
        proc.on('error', (e) => {
            console.log('Cannot start Selenium process.', e);
            // logGeneral.add('ERROR', 'Unable to find Java.
            // Make sure Java is installed and has been added to the PATH environment variable.');
            this._emitLogEvent(e.toString(), ServiceBase.SEVERITY_ERROR);
            // 'ERROR: Unable to find Java. Make sure Java is installed and has been added to the PATH environment variable.'
        });
        // on stderr 'data'
        proc.stderr.on('data', (data) => {
            // FIXME: check why all logs from Selenium are written to srderr instead of stdout!!!
            this._emitLogEvent(data.toString(), ServiceBase.SEVERITY_INFO);
        });
        // on stdout 'data'
        proc.stdout.on('data', (data) => {
            this._emitLogEvent(data.toString());
        });
        // on 'exit'
        proc.on('exit', (code) => {
            console.log('Selenium process finished.');

            if (code) {
                this._emitLogEvent('Selenium process finished with code: '+ code);
            } else {
                this._emitLogEvent('Selenium process finished without any code');
            }

            if (code === 1) {
                // logGeneral.add('ERROR', 'Selenium couldn\'t be started.
                // See the Selenium Server log for more details.');
                const msg = 'ERROR: Selenium couldn\'t be started. See the Selenium Server log for more details.';
                this._emitStoppedEvent(true, msg);
            }
            else {
                this._emitStoppedEvent();
            }
            this.seleniumProc = null;
        });
    }

    copyBundledDrivers(cwd) {
        // since userData is created only after IDE has been launched
        // we cannot place our bundled ChromeDrivers there during installation (also OS X DMG limitations)
        // thus we copy all bundled drivers from the installation dir
        return new Promise((resolve, reject) => {
            fs.copy(
                path.resolve(cwd, process.platform),
                this.getDriversRootPath(),
                { overwrite: false },
                err => {
                    // ignore errors
                    resolve();
                });
        });
    }

    // Gets Edge version. Returns null on failures.
    async getEdgeVersion() {
        const installations = edgeFinder[process.platform]();            
        if (installations && installations.length > 0) {
            console.log('Found Edge at: ', installations);
            if (process.platform === 'win32') {
                let {stdout,stderr} = await exec('wmic', [
                        'datafile',
                        'where',
                        `name='${installations[0].replace(/\\/g, '\\\\')}'`,
                        'get',
                        'version',
                        '/value'
                    ]);

                const dataCleaned = stdout.toString().trim().toLowerCase();
                if (!stderr && dataCleaned.indexOf('version=') > -1) {
                    const edgeVersion = dataCleaned.split('version=')[1].split('wmic')[0].replace(/\r?\n|\r/g, '');
                    return {
                                version: edgeVersion.split('.')[0],
                                path: installations[0]
                            };
                } else {
                    throw new Error('Unable to get Edge version');
                }
            } else {
                let {stdout,stderr} = await exec(installations[0], ['--version']);
                    if (!stderr) {
                        // like Microsoft Edge 85.0.564.63
                        let edgeVersion = stdout.toString().trim();
                        edgeVersion = edgeVersion.substr('Microsoft Edge '.length).split(' ')[0];
                        edgeVersion = edgeVersion.split('.')[0];
                        return {
                                    version: edgeVersion,
                                    path: installations[0]
                                };
                    } else {
                        throw new Error('Unable to get Edge version');
                    }
            }
        } else {
            throw new Error('Unable to find Edge');
        }
    }

    // Gets Chrome version. Returns null on failures.
    async getChromeVersion() {
        const installations = chromeFinder[process.platform]();

        if (installations && installations.length > 0) {
            console.log('Found Chrome at: ', installations);
            if (process.platform === 'win32') {
                let {stdout,stderr} = await exec('wmic',
                    [
                        'datafile',
                        'where',
                        `name='${installations[0].replace(/\\/g, '\\\\')}'`,
                        'get',
                        'version',
                        '/value'
                    ]);

                const dataCleaned = stdout.toString().trim().toLowerCase();
                if (!stderr && dataCleaned.indexOf('version=') > -1) {
                    const chromeVersion = dataCleaned.split('version=')[1].split('wmic')[0].replace(/\r?\n|\r/g, '');
                    return chromeVersion;
                } else {
                    throw new Error('Unable to get Chrome version');
                }
            } else {
                let {stdout,stderr} = await exec(installations[0], ['--version']);
                if (!stderr) {
                    const chromeVersion = stdout.toString().trim().substr('Google Chrome '.length).split(' ')[0];
                    return chromeVersion;
                } else {
                    throw new Error('Unable to get Chrome version');
                }
            }
        } else {
            throw new Error('Unable to find Chrome');
        }
    }

    convertLastReleaseVersion(body) {
        let result = '';
        const version = Buffer.from(body,'ucs-2').toString('ucs-2');

        if (version && version.length) {
            for (var i = 0; i < version.length; i++) {
                if (parseInt(version[i]) || ['.', '0'].includes(version[i])) {
                    result += `${version[i]}`;
                }
            }
        }

        return result;
    }

    getEdgeDriverVersion(edgeVersion) {
        return new Promise((resolve, reject) => {
            // try getting the version from a local version map file
            for (var version of edgeVersions) {
                if (version.edgeMin <= edgeVersion && version.edgeMax >= edgeVersion) {
                    resolve(version.driverVersion);
                    return;
                }
            }
            
            // try getting the version online
            let lastPart = 'MACOS';

            if (process.platform === 'win32') {
                lastPart = 'WINDOWS';
            }
            const versionUrl = `${EDGE_BASE_URL}/LATEST_RELEASE_${edgeVersion}_${lastPart}`;
            console.log('Getting Edge version from ', versionUrl);
            
            return fetch(versionUrl)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver version: ' + res.statusText));
                    }
                    return res.buffer();
                })
                .then(body => {
                    const driverVersion = this.convertLastReleaseVersion(body);
                    resolve(driverVersion);
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverPre115Version(chromeMajorVersion) {
        return new Promise((resolve, reject) => {
            // try getting the version from a local version map file
            for (var version of versions) {
                if (version.chromeMin <= chromeMajorVersion && version.chromeMax >= chromeMajorVersion) {
                    resolve(version.driverVersion);
                    return;
                }
            }

            // try getting the version online
            const versionUrl = `${CHROMEDRIVER_PRE_115_API_URL}/LATEST_RELEASE_${chromeMajorVersion}`;
            console.log('Getting ChromeDriver version from ' + versionUrl);
            return fetch(versionUrl)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver version: ' + res.statusText));
                    }
                    return res.buffer();
                })
                .then(body => {
                    let version;
                    if (body && body.toString) {
                        const bodyToString = body.toString();

                        if (bodyToString) {
                            version = bodyToString;
                        } else {
                            version = Buffer.from(body,'utf-8').toString();
                        }
                    } else {
                        version = Buffer.from(body,'utf-8').toString();
                    }
                    resolve(version);
                })
                .catch(err => reject(err));
        });
    }

    // starting with v115 chrome has different api for driver downloads
    getChromeDriverVersion(chromeVersion) {
        return new Promise((resolve, reject) => {
            // try getting the version from a local version map file
            for (var version of versions) {
                if (version.chromeMin <= chromeVersion && version.chromeMax >= chromeVersion) {
                    resolve(version.driverVersion);
                    return;
                }
            }

            // try getting the version online
            console.log(`Getting ChromeDriver 115+ version JSON ${CHROMEDRIVER_API_URL}`);
            return fetch(CHROMEDRIVER_API_URL)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver versions JSON: ' + res.statusText));
                    }
                    return res.buffer();
                })
                .then(body => {
                    var bodyStr = Buffer.from(body,'utf-8').toString();
                    var json = JSON.parse(bodyStr);

                    if (!json.versions) {
                        reject('No versions found in the json');
                        return;
                    }

                    for (var ver of json.versions) {
                        if (ver.version == chromeVersion) {
                            resolve(chromeVersion);
                            return;
                        }
                    }

                    reject('No matching version found in the json');
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverDownloadUrl(driverVersion) {
        const maj = driverVersion.split('.')[0];

        if (maj < 115) {
            let zipFilename;
            switch (process.platform) {
                case 'win32':
                    zipFilename = 'chromedriver_win32.zip'; break;
                case 'darwin':
                    zipFilename = 'chromedriver_mac64.zip'; break;
                case 'linux':
                    zipFilename = 'chromedriver_linux64.zip'; break;
                default:
                    zipFilename = null;
            }
            return `${CHROMEDRIVER_PRE_115_API_URL}/${driverVersion}/${zipFilename}`;  
        } else {
            let zipFilename;
            switch (process.platform) {
                case 'win32':
                    zipFilename = 'win64/chromedriver-win64.zip'; break;
                case 'darwin':
                    zipFilename = 'mac-x64/chromedriver-mac-x64.zip'; break;
                case 'linux':
                    zipFilename = 'linux64/chromedriver-linux64.zip'; break;
                default:
                    zipFilename = null;
            }
            return `${CHROMEDRIVER_DOWNLOAD_URL}/${driverVersion}/${zipFilename}`;  
        }
    }

    getEdgeDriverDownloadUrl(driverVersion) {
        var zipFilename;
        switch (process.platform) {
        case 'win32':
            zipFilename = 'edgedriver_win32.zip'; break;
        case 'darwin':
            zipFilename = 'edgedriver_mac64.zip'; break;
        default:
            zipFilename = null;
        }

        return `${EDGE_DOWNLOAD_DRIVER_URL}/${driverVersion}/${zipFilename}`;
    }

    getDriversRootPath() {
        return path.resolve(app.getPath('userData'), 'drivers');
    }

    getDirectories = (source) => {
        return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    }

    // find path to exact chromedriver version
    // or to the user placed binary in the root folder if driverVersion is falsy
    getChromeDriverBinPathExact(driverVersion) {
        return new Promise((resolve, reject) => {
            const driverBin = path.resolve(
                this.getDriversRootPath(),
                driverVersion ? CHROMEDRIVER_FOLDER_START + driverVersion : '',
                'chromedriver' + (process.platform === 'win32' ? '.exe' : '')
            );

            fs.access(driverBin, err => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(driverBin);
            });
        });
    }

    // find path to exact edfedriver version
    // or to the user placed binary in the root folder if driverVersion is falsy
    getEdgeDriverBinPathExact(driverVersion) {
        return new Promise((resolve, reject) => {
            const driverBin = path.resolve(
                this.getDriversRootPath(),
                driverVersion ? EDGE_FOLDER_START + driverVersion : '',
                'msedgedriver' + (process.platform === 'win32' ? '.exe' : '')
            );

            fs.access(driverBin, err => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(driverBin);
            });
        });
    }

    // find path to the highest available BUILD version. E.g 85.0.4183.xx
    getChromeDriverBinPathApprox(driverVersion) {
        const segments = driverVersion.split('.');
        const globVersion = `${segments[0]}.${segments[1]}.${segments[2]}.*/chromedriver${process.platform === 'win32' ? '.*' : ''}`;

        return new Promise((resolve, reject) => {
            const approx = path.resolve(this.getDriversRootPath(), CHROMEDRIVER_FOLDER_START + globVersion);
            glob(approx, (err, files) => {
                if (err || files.length === 0) {
                    resolve(null);
                    return;
                }
                files.sort((a, b) => {
                    var buidVerA = parseInt(path.basename(a).split('.')[3], 10);
                    var buidVerB = parseInt(path.basename(b).split('.')[3], 10);
                    return buidVerA - buidVerB;
                });
                resolve(files[files.length - 1]);
            });
        });
    }

    // kill any active chromedriver processes
    async _killChromeDriverProcess() {
        try {
            if (process.platform === 'win32') {
                await exec('taskkill', ['/IM', 'chromedriver.exe', '/F']);
            } else {
                await exec('killall', ['chromedriver']);
            }
        } catch (err) {
            // ignore errors since the process does not necessary exists at all
        }
    }

    // kill any active edgedriver processes
    async _killEdgeDriverProcess() {

        try {
            if (process.platform === 'win32') {
                await exec('taskkill', ['/IM', 'msedgedriver.exe', '/F']);
            } else {
                await exec('killall', ['msedgedriver']);
            }
        } catch (err) {
            // ignore errors since the process does not necessary exists at all
        }
    }

    // return path to the driver binary if exists or null otherwise
    async findLocalChromeDriver(driverVersion) {
        if (!driverVersion) {
            return;
        }
        // for Chrome 73+
        if (driverVersion.split('.').length > 2) {
            return await this.getChromeDriverBinPathApprox(driverVersion);
        } else {
            return await this.getChromeDriverBinPathExact(driverVersion);
        }
    }

    findLocalEdgeDriver(driverVersion) {
        if (!driverVersion) {
            return;
        }
        const segments = driverVersion.split('.');
        const globVersion = `${segments[0]}.${segments[1]}.${segments[2]}.*/msedgedriver${process.platform === 'win32' ? '.*' : ''}`;
 
        return new Promise((resolve, reject) => {
            const approx = path.resolve(this.getDriversRootPath(), EDGE_FOLDER_START + globVersion);
            glob(approx, (err, files) => {
                if (err || files.length === 0) {
                    resolve(null);
                    return;
                }
                files.sort((a, b) => {
                    var aFolerName = path.basename(path.dirname(a));
                    var bFolerName = path.basename(path.dirname(b));
                    var buidVerA = parseInt(aFolerName.split('.')[3], 10);
                    var buidVerB = parseInt(bFolerName.split('.')[3], 10);
                    return buidVerA - buidVerB;
                });
                resolve(files[files.length - 1]);
            });
        });
    }

    fetchDriver(downloadUrl) {
        return new Promise((resolve, reject) => {
            try {
                fetch(downloadUrl)
                    .then(res => {
                        if (!res.ok) {
                            return new Error('Unable to download Driver: ' + res.statusText);
                        }

                        if (res && res.buffer) {
                            return res.buffer();
                        } else {
                            return new Error('res.buffer is not defined');
                        }
                    })
                    .then(buffer => {
                        if (buffer instanceof Error) {
                            resolve(buffer);
                        } else {
                            var zipPath = tmp.tmpNameSync();
                            fs.writeFile(zipPath, buffer, err => {
                                if (err) {
                                    console.log('writeFile error', err);
                                    resolve(err);
                                }
                                resolve(zipPath);
                            });
                        }
                    }).catch(err => {
                        console.log('fetchDriver fetch error', err);
                        resolve(err);
                    });
            } catch (error) {
                console.log('fetchDriver error', error);
                resolve(error);
            }
        });
    }

    async decompressZip(driverVersion, zipPath, folderStart) {
        var driverDir = path.resolve(this.getDriversRootPath(), folderStart + driverVersion);
        await extract(zipPath, { dir: driverDir });

        // some drivers for chrome >= 115 will have an internal directory zipped
        // so we need to move the binary outside of it

        let subdir;
        switch (process.platform) {
            case 'win32':
                subdir = 'chromedriver-win64'; break;
            case 'darwin':
                subdir = 'chromedriver-mac-x64'; break;
            case 'linux':
                subdir = 'chromedriver-linux64'; break;
            default:
                subdir = null;
        }

        var driverSubPathBin = path.join(driverDir, subdir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
        var driverPathBin = path.join(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));

        if (fs.existsSync(driverSubPathBin)) {
            fs.renameSync(driverSubPathBin, driverPathBin);
        }

        return driverDir;
    }

    chmodChromeDriver(driverDir) {
        return new Promise((resolve, reject) => {
            try {
                var driverBin = path.resolve(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
                // chmod +x on POSIX
                if (process.platform !== 'win32') {
                    console.log('chmod +x ' + driverBin);
                    fs.chmod(driverBin, fs.constants.S_IXUSR | fs.constants.S_IXGRP, err => {
                        if (err) {
                            console.log('fs.chmod error', err);
                            resolve(err);
                        } else {
                            resolve(driverBin);
                        }
                    });
                } else {
                    resolve(driverBin);
                }
            } catch (error) {
                console.log('chmodChromeDriver error', error);
                resolve(error);
            }
        });
    }

    chmodEdgeDriver(driverDir) {
        return new Promise((resolve, reject) => {
            try {
                var driverBin = path.resolve(driverDir, 'msedgedriver' + (process.platform === 'win32' ? '.exe' : ''));
                // chmod +x on POSIX
                if (process.platform !== 'win32') {
                    console.log('chmod +x ' + driverBin);
                    fs.chmod(driverBin, fs.constants.S_IXUSR | fs.constants.S_IXGRP, err => {
                        if (err) {
                            console.log('fs.chmod error', err);
                            resolve(err);
                        } else {
                            resolve(driverBin);
                        }
                    });
                } else {
                    resolve(driverBin);
                }
            } catch (error) {
                console.log('chmodEdgeDriver error', error);
                resolve(error);
            }
        });
    }
    
    async downloadEdgeDriver(driverVersion) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const downloadUrl = this.getEdgeDriverDownloadUrl(driverVersion);
                console.log('Downloading ' + downloadUrl);

                if (downloadUrl) {
                    try {
                        await this._killEdgeDriverProcess();
                    } catch (error) {
                        console.log('_killEdgeDriverProcess error', error);
                    }
    
                    let zipPath;
                    try {
                        zipPath = await this.fetchDriver(downloadUrl);
                    } catch (error) {
                        resolve(error);
                    }

                    if (zipPath) {
                        if (zipPath instanceof Error) {
                            resolve(zipPath);
                        } else {
                            let driverDir;

                            try {
                                driverDir = await this.decompressZip(driverVersion, zipPath, EDGE_FOLDER_START);
                            } catch (error) {
                                resolve(error);
                            }

                            if (driverDir) {
                                if (driverDir instanceof Error) {
                                    resolve(driverDir);
                                } else {
                                    let driverBin;
                                    
                                    try {
                                        driverBin = await this.chmodEdgeDriver(driverDir);
                                    } catch (error) {
                                        resolve(error);
                                    }

                                    if (driverBin) {
                                        // Final stage
                                        resolve(driverBin);
                                    } else {
                                        resolve(new Error('driverBin is not defined', driverBin));
                                    }
                                }
                            } else {
                                resolve(new Error('driverDir is not defined', driverDir));
                            }
                        }
                    } else {
                        resolve(new Error('zipPath is not defined', zipPath));
                    }
                } else {
                    resolve(new Error('downloadUrl is not defined', downloadUrl));
                }
            } catch (error) {
                console.log('downloadEdgeDriver error', error);
                resolve(error);
            }
        });
    }

    async downloadChromeDriver(driverVersion) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const downloadUrl = this.getChromeDriverDownloadUrl(driverVersion);
                console.log('Downloading ' + downloadUrl);

                if (downloadUrl) {
                    try {
                        await this._killChromeDriverProcess();
                    } catch (error) {
                        console.log('_killChromeDriverProcess error', error);
                    }
    
                    let zipPath;
                    try {
                        zipPath = await this.fetchDriver(downloadUrl);
                    } catch (error) {
                        resolve(error);
                    }

                    if (zipPath) {
                        if (zipPath instanceof Error) {
                            resolve(zipPath);
                        } else {
                            let driverDir;

                            try {
                                driverDir = await this.decompressZip(driverVersion, zipPath, CHROMEDRIVER_FOLDER_START);
                            } catch (error) {
                                resolve(error);
                            }

                            if (driverDir) {
                                if (driverDir instanceof Error) {
                                    resolve(driverDir);
                                } else {
                                    let driverBin;
                                    
                                    try {
                                        driverBin = await this.chmodChromeDriver(driverDir);
                                    } catch (error) {
                                        resolve(error);
                                    }

                                    if (driverBin) {
                                        // Final stage
                                        resolve(driverBin);
                                    } else {
                                        resolve(new Error('driverBin is not defined', driverBin));
                                    }
                                }
                            } else {
                                resolve(new Error('driverDir is not defined', driverDir));
                            }
                        }
                    } else {
                        resolve(new Error('zipPath is not defined', zipPath));
                    }
                } else {
                    resolve(new Error('downloadUrl is not defined', downloadUrl));
                }
            } catch (error) {
                console.log('downloadChromeDriver error', error);
                resolve(error);
            }
        });
    }
}
