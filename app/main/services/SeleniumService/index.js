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
import { spawn } from 'cross-spawn';
import fs from 'fs-extra';
import tmp from 'tmp';
import DecompressZip from 'decompress-zip';
import { versions } from './chromedriver-versions.json';
import fetch from 'node-fetch';
import ServiceBase from '../ServiceBase';

import cfg from '../../config.json';
const selSettings = cfg.selenium;

// Events
const ON_SELENIUM_STARTED = 'SELENIUM_STARTED';
const ON_SELENIUM_STOPPED = 'SELENIUM_STOPPED';
const ON_CHROME_DRIVER_ERROR = 'ON_CHROME_DRIVER_ERROR';

const CHROMEDRIVER_BASE_URL = 'https://chromedriver.storage.googleapis.com';

export default class SeleniumService extends ServiceBase {

    constructor() {
        super();

        this.seleniumProc = null;
        this.availablePort = null;

        this.downloadChromeDriver = this.downloadChromeDriver.bind(this);
    }

    async start() {
        return await this._detectPortAndStart();
    }

    _detectPortAndStart(){
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

    async getChromeDriverVersionAndChromeVersion(){
        const result = {};
        var chromedriver;
        try {
            const chromeVersion = await this.getChromeVersion();
            console.log('Found Chrome version: ' + chromeVersion);

            result.chromeVersion = chromeVersion;

            var chromeDriverVersion = await this.getChromeDriverVersion(chromeVersion);
            console.log('Required ChromeDriver version: ' + chromeDriverVersion);

            result.chromeDriverVersion = chromeDriverVersion;

            chromedriver = await this.findLocalChromeDriver(chromeDriverVersion);


            if (chromedriver) {
                console.log('Found matching ChromeDriver at ' + chromedriver);

                result.error = false;
                
            } else {
                console.log('Not Found matching ChromeDriver at ' + chromedriver);
                result.error = true;
            }
        } catch (e) {
            console.warn('Failure setting up ChromeDriver', e);
            result.error = true;
        }

        return result;
    }


    async _startProcess(port) {
        let cwd;
        if (process.env.NODE_ENV === 'production') {
            cwd = path.resolve(__dirname, process.env.RELEASE_BUILD ? '../../app.asar.unpacked/main/selenium' : 'selenium');
        } else {
            cwd = path.resolve(__dirname, '..', '..', 'selenium');
        }

        await this.copyBundledChromeDrivers(cwd);

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
            console.warn('Failure setting up ChromeDriver', e);
            // if something bad happens, check if user has placed the driver manually
            // findLocalChromeDriver without arguments will try to resolve driver located at the root folder
            chromedriver = await this.findLocalChromeDriver();
            if (chromedriver) {
                console.log('Using user placed ChromeDriver from ' + chromedriver);
            } else {
                // if no user placed driver then use, the latest bundled version
                chromedriver = await this.findLocalChromeDriver(versions[0].driverVersion);
                if(chromedriver){
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

        const selArgs = [selSettings.jar].concat(selSettings.args);
    
        let geckodriver = null;
    
        if (process.platform === 'win32') {
            geckodriver = 'win32/geckodriver.exe';
        } else if (process.platform === 'darwin') {
            geckodriver = 'darwin/geckodriver';
        } else {
            geckodriver = 'linux/geckodriver';
        }
    
        selArgs.unshift(`-Dwebdriver.chrome.driver="${chromedriver}"`);
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
            this._emitLogEvent(data.toString(), ServiceBase.SEVERITY_ERROR);
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

    copyBundledChromeDrivers(cwd) {
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

    getChromeDriverVersion(chromeVersion) {
        return new Promise((resolve, reject) => {
            // try getting the version from a local version map file
            for (var version of versions) {
                if (version.chromeMin >= chromeVersion && version.chromeMax <= chromeVersion) {
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
                    const version = new Buffer(body,'utf-8').toString();
                    resolve(version);
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverDownloadUrl(driverVersion){
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

    getDriversRootPath() {
        return path.resolve(app.getPath('userData'), 'drivers');
    }

    getChromeDriverBinnaryPath(driverVersion) {
        return path.join(
            this.getDriversRootPath(),
            driverVersion ? 'chromedriver-' + driverVersion : '',
            'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
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

    // return path to the driver binary if exists or null otherwise
    findLocalChromeDriver(driverVersion) {
        return new Promise((resolve, reject) => {
            var driverBin = this.getChromeDriverBinnaryPath(driverVersion);
            fs.access(driverBin, err => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(driverBin);
            });
        });
    }

    fetchChromeDriver(downloadUrl){
        return new Promise((resolve, reject) => {
            try{
                fetch(downloadUrl)
                    .then(res => {
                        if (!res.ok) {
                            return new Error('Unable to download ChromeDriver: ' + res.statusText);
                        }

                        if(res && res.buffer){
                            return res.buffer();
                        } else {
                            return new Error('res.buffer is not defined');
                        }
                    })
                    .then(buffer => {
                        /*eslint-disable */
                        if(buffer instanceof Error){
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
                        /*eslint-enable */
                    }).catch(err => {
                        console.log('fetchChromeDriver fetch error', err);
                        resolve(err);
                    });
            } catch(error){
                console.log('fetchChromeDriver error', error);
                resolve(error);
            }
        });
    }

    decompressZip(driverVersion, zipPath){
        return new Promise((resolve, reject) => {
            try{
                var driverDir = path.join(this.getDriversRootPath(), 'chromedriver-' + driverVersion);
    
                var unzip = new DecompressZip(zipPath);
    
                unzip.on('error', (err) => {
                    console.log('unzip error', err);
                    resolve(err);
                });
    
                unzip.on('extract', (log) => {
                    resolve(driverDir);
                });
    
                unzip.extract({
                    path: driverDir,
                    strip: 1
                });
            } catch(error){
                console.log('decompressZip error', error);
                resolve(error);
            }
        });
    }

    chmodChromeDriver(driverDir){
        return new Promise((resolve, reject) => {
            try{
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
            } catch(error){
                console.log('chmodChromeDriver error', error);
                resolve(error);
            }
        });
    }
    
    async downloadChromeDriver(driverVersion){
        /*eslint-disable */
        return new Promise(async (resolve, reject) => {

            try{
                const downloadUrl = this.getChromeDriverDownloadUrl(driverVersion);
                console.log('Downloading ' + downloadUrl);

                if(downloadUrl){

                    let killResult;
                    try {
                        killResult = await this._killChromeDriverProcess();
                    } catch (error) {
                        console.log('_killChromeDriverProcess error', error);
                        resolve(error);
                    }
    
                    if(killResult){
                        let zipPath;
                        try {
                            zipPath = await this.fetchChromeDriver(downloadUrl);
                        } catch (error) {
                            resolve(error);
                        }

                        if(zipPath){
                            if(zipPath instanceof Error){
                                resolve(zipPath);
                            } else {
                                let driverDir;

                                try {
                                    driverDir = await this.decompressZip(driverVersion, zipPath);
                                } catch (error) {
                                    resolve(error);
                                }

                                if(driverDir){
                                    if(driverDir instanceof Error){
                                        resolve(driverDir);
                                    } else {
                                        let driverBin;
                                        
                                        try {
                                            driverBin = await this.chmodChromeDriver(driverDir);
                                        } catch (error) {
                                            resolve(error);
                                        }

                                        if(driverBin){
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
            } catch(error) {
                console.log('downloadChromeDriver error', error);
                resolve(error);
            }
        });
        /*eslint-enable */
    }
}
