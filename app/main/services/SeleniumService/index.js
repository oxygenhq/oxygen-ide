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
const ON_SELENIUM_LOG_ENTRY = 'ON_SELENIUM_LOG_ENTRY';
const ON_CHROME_DRIVER_ERROR = 'ON_CHROME_DRIVER_ERROR';

const CHROMEDRIVER_BASE_URL = 'https://chromedriver.storage.googleapis.com'

export default class SeleniumService extends ServiceBase {
    seleniumProc = null;
    availablePort = null;

    constructor() {
        super();
    }

    async start() {
        return await this._detectPortAndStart();
    }

    _detectPortAndStart(){
        return detectPort(selSettings.port)
            .then(availablePort => {
                this._startProcess(availablePort);
                this.availablePort = availablePort;
                return availablePort;
            })
            .catch(err => {
                const result = 'Unable to start Selenium';
                console.log(result, err);
                return result;
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

    async _startProcess(port) {
        const cwd = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, 'selenium') : path.resolve(__dirname, '..', '..', 'selenium');

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
                if(chromeVersion && chromeDriverVersion){
                    this.notify({
                        type: ON_CHROME_DRIVER_ERROR,
                        chromeVersion: chromeVersion,
                        chromeDriverVersion: chromeDriverVersion,
                    });
                }

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
                console.log('Using latest bundled ChromeDriver from ' + chromedriver);
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
    
        selArgs.unshift(`-Dwebdriver.chrome.driver=${chromedriver}`);
        selArgs.unshift(`-Dwebdriver.gecko.driver=${geckodriver}`);
    
        if (process.platform === 'win32') {
            selArgs.unshift('-Dwebdriver.ie.driver=win32/IEDriverServer_x86.exe');
        }
        selArgs.push('-port');
        selArgs.push(port.toString());
        selArgs.unshift('-jar');

        console.log('Attempting to start Selenium process with the following args:', selArgs);
        this.seleniumProc = cp.spawn('java', selArgs, { cwd, shell: true });
        this._emitStartedEvent(port);
        this._handleProcessEvents();
    }

    _handleProcessEvents() {
        const proc = this.seleniumProc;
        if (!proc) {
            log.error('Selenium process was not started.');
            return;
        }
        // on 'error'
        proc.on('error', (e) => {
            log.error('Cannot start Selenium process.', e);
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
            for (let version of versions) {
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
                    return res.buffer()
                })
                .then(body => resolve(body))
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
                cp.on('exit', () => resolve());
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve());
            } else {
                const cp = spawn('killall', ['chromedriver']);
                cp.on('exit', () => resolve());
                // ignore errors since the process does not necessary exists at all
                cp.on('error', () => resolve());
            }
        });
    }

    // return path to the driver binary if exists or null otherwise
    findLocalChromeDriver(driverVersion) {
        return new Promise((resolve, reject) => {
            var driverBin = this.getChromeDriverBinnaryPath(driverVersion);
            try {
                fs.access(driverBin, err => {
                    if (err) {
                        resolve(null);
                        return;
                    }
                    resolve(driverBin);
                });
            } catch (e) {
                // errors are ignored
                resolve(null);
            }
        });
    }

    downloadChromeDriver(driverVersion) {
        return new Promise((resolve, reject) => {
            const downloadUrl = this.getChromeDriverDownloadUrl(driverVersion);
            console.log('Downloading ' + downloadUrl);

            try{
                this._killChromeDriverProcess()
                .then(() => {
                    return fetch(downloadUrl)
                        .then(res => {
                            if (!res.ok) {
                                reject(new Error('Unable to download ChromeDriver: ' + res.statusText));
                            }
                            return res.buffer();
                        })
                        .then(buffer => {
                            return new Promise((resolve, reject) => {
                                var zipPath = tmp.tmpNameSync();
                                fs.writeFile(zipPath, buffer, err => {
                                    if (err) {
                                        reject(err);
                                    }
                                    resolve(zipPath);
                                });
                            });
                        })
                        .then(zipPath => {
                            return new Promise((resolve, reject) => {
                                var driverDir = path.join(this.getDriversRootPath(), 'chromedriver-' + driverVersion);

                                var unzip = new DecompressZip(zipPath);

                                unzip.on('error', (err) => {
                                    reject(err);
                                });

                                unzip.on('extract', (log) => {
                                    resolve(driverDir);
                                });

                                try{
                                    unzip.extract({
                                        path: driverDir,
                                        strip: 1
                                    });
                                } catch(e){
                                    console.log('Unzip extract error', e);
                                }
                            });
                        })
                        .then(driverDir => {
                            if(driverDir){
                                var driverBin = path.join(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));

                                // chmod +x on POSIX
                                if (process.platform !== 'win32') {
                                    console.log('chmod +x ' + driverBin);
                                    fs.chmod(driverBin, mode, err => {
                                        if (err) {
                                            reject(err);
                                        } else {
                                            resolve(driverBin);
                                        }
                                    });
                                } else {
                                    resolve(driverBin);
                                }
                            }
                        })
                        .catch(err => {
                            console.log('downloadChromeDriver error', err);
                            resolve(err)
                        });
                });
                
            } catch(err) {
                console.log('downloadChromeDriver error', err);
            }
        });
    }
}
