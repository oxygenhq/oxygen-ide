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
import * as chromeFinder from 'chrome-launcher/dist/chrome-finder';
import * as edgeFinder from './edge-finder';
import { spawn } from 'cross-spawn';
import fs from 'fs-extra';
import tmp from 'tmp';
import extract from 'extract-zip';
import { versions } from './chromedriver-versions.json';
import { edgeVersions } from './edgedriver-versions.json';
import fetch from 'node-fetch';
import ServiceBase from '../ServiceBase';
import glob from 'glob';
// import parser from 'xml2json';

import cfg from '../../config.json';
const selSettings = cfg.selenium;

// Events
const ON_SELENIUM_STARTED = 'SELENIUM_STARTED';
const ON_SELENIUM_STOPPED = 'SELENIUM_STOPPED';
const ON_CHROME_DRIVER_ERROR = 'ON_CHROME_DRIVER_ERROR';
const ON_EDGE_FINDED = 'ON_EDGE_FINDED';
const CHROMEDRIVER_FOLDER_START = 'chromedriver-';
const CHROMEDRIVER_BASE_URL = 'https://chromedriver.storage.googleapis.com';

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

    _emitStartedEvent(port) {

        console.log('_emitStartedEvent', port);

        this.notify({
            type: ON_SELENIUM_STARTED,
            port: port,
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
        try {
            const edgeVersion = await this.getEdgeVersion();
            console.log('Found Edge version: ', edgeVersion);

            var edgeDriverVersion = await this.getEdgeDriverVersion(edgeVersion);
            console.log('Required Edge version: ', edgeDriverVersion);

            edgeDriver = await this.findLocalEdgeDriver(edgeDriverVersion);
            if (edgeDriver) {
                console.log('Found matching EdgeDriver at ', edgeDriver);
                
                this.notify({
                    type: ON_EDGE_FINDED
                });
            } else {
                throw new Error('Cannot find it localy');
            }
        } catch (e) {            
            console.warn('Failure setting up EdgeDriver.', e);
            // if something bad happens, check if user has placed the driver manually
            // getEdgeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            edgeDriver = await this.getEdgeDriverBinPathExact();
            if (edgeDriver) {
                console.log('Using user placed ChromeDriver from ' + edgeDriver);
            } else {
                // if no user placed driver then use, the latest bundled version
                edgeDriver = await this.findLocalEdgeDriver(edgeVersions[0].driverVersion);
                if (edgeDriver) {
                    console.log('Using latest bundled ChromeDriver from ' + edgeDriver);
                } else {
                    this.notify({
                        type: ON_EDGE_DRIVER_ERROR,
                        edgeVersion: edgeDriverVersion,
                        edgeDriverVersion: edgeDriver,
                    });
                }
            }
        }
        return edgeDriver;
    }

    async chromeStart() {
        var chromedriver;
        try {
            const chromeVersion = await this.getChromeVersion();
            console.log('Found Chrome version: ' + chromeVersion);

            var chromeDriverVersion = await this.getChromeDriverVersion(chromeVersion);
            console.log('Required ChromeDriver version: ' + chromeDriverVersion);

            chromedriver = await this.findLocalChromeDriver(chromeDriverVersion);
            if (chromedriver) {
                console.log('Found matching ChromeDriver at ' + chromedriver);
            } else {
                throw new Error('Cannot find it localy');
            }
        } catch (e) {
            console.warn('Failure setting up ChromeDriver.', e);
            // if something bad happens, check if user has placed the driver manually
            // getChromeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            chromedriver = await this.getChromeDriverBinPathExact();
            if (chromedriver) {
                console.log('Using user placed ChromeDriver from ' + chromedriver);
            } else {
                // if no user placed driver then use, the latest bundled version
                chromedriver = await this.findLocalChromeDriver(versions[0].driverVersion);
                if (chromedriver) {
                    console.log('Using latest bundled ChromeDriver from ' + chromedriver);
                } else {
                    this.notify({
                        type: ON_CHROME_DRIVER_ERROR,
                        chromeVersion: chromeDriverVersion,
                        chromeDriverVersion: chromedriver,
                    });
                }
            }
        }
        return chromedriver;
    }

    async _startProcess(port) {
        let cwd;
        if (process.env.NODE_ENV === 'production') {
            cwd = path.resolve(__dirname, process.env.RELEASE_BUILD ? '../../app.asar.unpacked/main/selenium' : 'selenium');
        } else {
            cwd = path.resolve(__dirname, '..', '..', 'selenium');
        }

        await this.copyBundledDrivers(cwd);

        const edgeDriver = await this.edgeStart();
        const chromedriver = await this.chromeStart();

        const selArgs = [selSettings.jar].concat(selSettings.args);
    
        let geckodriver = null;
    
        if (process.platform === 'win32') {
            geckodriver = 'win32/geckodriver.exe';
        } else if (process.platform === 'darwin') {
            geckodriver = 'darwin/geckodriver';
        } else {
            geckodriver = 'linux/geckodriver';
        }
    
        if (chromedriver) {
            selArgs.unshift(`-Dwebdriver.chrome.driver="${chromedriver}"`);
        }
        if (edgeDriver) {
            selArgs.unshift(`-Dwebdriver.edge.driver="${edgeDriver}"`);
        }
        selArgs.unshift(`-Dwebdriver.gecko.driver="${geckodriver}"`);
    
        if (process.platform === 'win32') {
            selArgs.unshift('-Dwebdriver.ie.driver=win32/IEDriverServer_x86.exe');
        }
        selArgs.push('-port');
        selArgs.push(port.toString());
        selArgs.unshift('-jar');

        console.log('Attempting to start Selenium process with the following args:', selArgs);
        this.seleniumProc = cp.spawn('java', selArgs, { cwd, shell: true });

        let seleniumPid = null;

        if (this.seleniumProc && this.seleniumProc.pid) {
            seleniumPid = this.seleniumProc.pid;
        }

        this._emitStartedEvent(port);
        this._handleProcessEvents();

        return seleniumPid;
    }

    _handleProcessEvents() {
        const proc = this.seleniumProc;
        if (!proc) {
            global.log.error('Selenium process was not started.');
            return;
        }
        // on 'error'
        proc.on('error', (e) => {
            global.log.error('Cannot start Selenium process.', e);
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
                path.join(cwd, process.platform),
                this.getDriversRootPath(),
                { overwrite: false },
                err => {
                    // ignore errors
                    resolve();
                });
        });
    }

    // Gets Edge version. Returns null on failures.
    getEdgeVersion() {
        return new Promise((resolve, reject) => {
            const installations = edgeFinder[process.platform]();            
            if (installations && installations.length > 0) {
                console.log('Found Edge at: ', installations);
                if (process.platform === 'win32') {
                    const cp = spawn('wmic',
                        [
                            'datafile',
                            'where',
                            `name='${installations[0].replace(/\\/g, '\\\\')}'`,
                            'get',
                            'version',
                            '/value'
                        ]);
                    cp.on('exit', () => reject(new Error('Unable to get Edge version')));
                    cp.stderr.on('data', () => reject(new Error('Unable to get Edge version')));
                    cp.stdout.on('data', (data) => {
                        const dataCleaned = data.toString().trim().toLowerCase();
                        if (dataCleaned.indexOf('version=') > -1) {
                            const edgeVersion = dataCleaned.split('version=')[1].split('wmic')[0].replace(/\r?\n|\r/g, '');
                            resolve(edgeVersion.split('.')[0]);
                        }
                    });
                } else {
                    const cp = spawn(installations[0], ['--version']);
                    cp.on('exit', () => reject(new Error('Unable to get Edge version')));
                    cp.stderr.on('data', () => reject(new Error('Unable to get Edge version')));
                    cp.stdout.on('data', (data) => {
                        // like Microsoft Edge 85.0.564.63
                        let edgeVersion = data.toString().trim();
                        edgeVersion = edgeVersion.substr('Microsoft Edge '.length).split(' ')[0];
                        edgeVersion = edgeVersion.split('.')[0];
                        resolve(edgeVersion);
                    });
                }
            } else {
                reject(new Error('Unable to find Edge'));
            }
        });
    }

    // Gets Chrome version. Returns null on failures.
    getChromeVersion() {
        return new Promise((resolve, reject) => {
            const installations = chromeFinder[process.platform]();

            if (installations && installations.length > 0) {
                console.log('Found Chrome at: ', installations);
                if (process.platform === 'win32') {
                    const cp = spawn('wmic',
                        [
                            'datafile',
                            'where',
                            `name='${installations[0].replace(/\\/g, '\\\\')}'`,
                            'get',
                            'version',
                            '/value'
                        ]);
                    cp.on('exit', () => reject(new Error('Unable to get Chrome version')));
                    cp.stderr.on('data', () => reject(new Error('Unable to get Chrome version')));
                    cp.stdout.on('data', (data) => {
                        const dataCleaned = data.toString().trim().toLowerCase();
                        if (dataCleaned.indexOf('version=') > -1) {
                            const chromeVersion = dataCleaned.split('version=')[1].split('wmic')[0].replace(/\r?\n|\r/g, '');
                            resolve(chromeVersion.split('.')[0]);
                        }
                    });
                } else {
                    const cp = spawn(installations[0], ['--version']);
                    cp.on('exit', () => reject(new Error('Unable to get Chrome version')));
                    cp.stderr.on('data', () => reject(new Error('Unable to get Chrome version')));
                    cp.stdout.on('data', (data) => {
                        const chromeVersion = data.toString().trim().substr('Google Chrome '.length).split(' ')[0];
                        resolve(chromeVersion.split('.')[0]);
                    });
                }
            } else {
                reject(new Error('Unable to find Chrome'));
            }
        });
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
            const versionUrl = `${CHROMEDRIVER_BASE_URL}/LATEST_RELEASE_${chromeVersion}`;
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
                            version = new Buffer(body,'utf-8').toString();
                        }
                    } else {
                        version = new Buffer(body,'utf-8').toString();
                    }
                    resolve(version);
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverDownloadUrl(driverVersion) {
        var zipFilename;
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

        return `${CHROMEDRIVER_BASE_URL}/${driverVersion}/${zipFilename}`;
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
            const driverBin = path.join(this.getDriversRootPath(),
                driverVersion ? CHROMEDRIVER_FOLDER_START + driverVersion : '',
                'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
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
            const driverBin = path.join(this.getDriversRootPath(),
                driverVersion ? EDGE_FOLDER_START + driverVersion : '',
                'edgedriver' + (process.platform === 'win32' ? '.exe' : ''));
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
            const approx = path.join(this.getDriversRootPath(), CHROMEDRIVER_FOLDER_START + globVersion);
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
    _killChromeDriverProcess() {
        return new Promise((resolve, reject) => {
            if (process.platform === 'win32') {
                const cp = spawn('taskkill', ['/IM', 'chromedriver.exe', '/F']);
                cp.on('exit', () => resolve(true));
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve(true));
            } else {
                const cp = spawn('killall', ['chromedriver']);
                cp.on('exit', () => resolve(true));
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve(true));
            }
        });
    }

    // kill any active edgedriver processes
    _killEdgeDriverProcess() {
        return new Promise((resolve, reject) => {
            if (process.platform === 'win32') {
                const cp = spawn('taskkill', ['/IM', 'msedgedriver.exe', '/F']);
                cp.on('exit', () => resolve(true));
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve(true));
            } else {
                const cp = spawn('killall', ['msedgedriver']);
                cp.on('exit', () => resolve(true));
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve(true));
            }
        });
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
            const approx = path.join(this.getDriversRootPath(), EDGE_FOLDER_START + globVersion);
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
        var driverDir = path.join(this.getDriversRootPath(), folderStart + driverVersion);
        await extract(zipPath, { dir: driverDir });
        return driverDir;
    }

    chmodChromeDriver(driverDir) {
        return new Promise((resolve, reject) => {
            try {
                var driverBin = path.join(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
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
                var driverBin = path.join(driverDir, 'msedgedriver' + (process.platform === 'win32' ? '.exe' : ''));
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

                    let killResult;
                    try {
                        killResult = await this._killEdgeDriverProcess();
                    } catch (error) {
                        console.log('_killEdgeDriverProcess error', error);
                        resolve(error);
                    }
    
                    if (killResult) {
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
                        resolve(new Error('killResult is not defined', killResult));
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

                    let killResult;
                    try {
                        killResult = await this._killChromeDriverProcess();
                    } catch (error) {
                        console.log('_killChromeDriverProcess error', error);
                        resolve(error);
                    }
    
                    if (killResult) {
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
                        resolve(new Error('killResult is not defined', killResult));
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
