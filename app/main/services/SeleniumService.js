/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';
import cp from 'child_process';
import detectPort from 'detect-port';
import ServiceBase from "./ServiceBase";

import cfg from '../config.json';
const selSettings = cfg.selenium;

// Events
const ON_SELENIUM_STARTED = 'SELENIUM_STARTED';
const ON_SELENIUM_STOPPED = 'SELENIUM_STOPPED';
const ON_SELENIUM_LOG_ENTRY = 'ON_SELENIUM_LOG_ENTRY';

export default class SeleniumService extends ServiceBase {
    seleniumProc = null;
    availablePort = null;

    constructor() {
        super();
    }

    async start() {
        let result;
        // prevent from starting the process twice
        if (this.seleniumProc != null) {
            result = 'twice_port=';
            this.stop();
            const detectPortResult = await this.detectPort();
            result+= detectPortResult;
        } else {
            const detectPortResult = await this.detectPort();
            result = detectPortResult;
        }

        return result;
    }

    detectPort(){
        let result;
        // get available port
        return detectPort(selSettings.port)
        .then(availablePort => {
            this._startProcess(availablePort);
            this.availablePort = availablePort;
            return availablePort;
        })
        .catch(err => {
            result = `Port "${selSettings.port}" on "localhost" is already in use. Please set another port in config.json file.`;
            console.log(`Port "${selSettings.port}" on "localhost" is already in use. Please set another port in config.json file.`, err);
            return result;
        });

        //let result;
        // detectPort(selSettings.port, (err, availablePort) => {
        //     if (err) {
        //         result = `Port "${port}" on "localhost" is already in use. Please set another port in config.json file.`;
        //         console.error(`Port "${port}" on "localhost" is already in use. Please set another port in config.json file.`, err);
        //     } else {
                
        //         this._startProcess(availablePort);
        //         this.availablePort = availablePort;
        //         console.log('availablePort', availablePort);
        //         result = 'availablePort';
        //     }
        // });
        // return result;
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
    }

    _emitStoppedEvent(failed, msg) {
        this.notify(
            ON_SELENIUM_STOPPED,
            msg,
            (failed ? ServiceBase.SEVERITY_ERROR : ServiceBase.SEVERITY_INFO),
        );
    }

    _emitStartedEvent(port) {
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
        const pltfm = process.platform;
        if (pltfm === 'win32') {
            try {
                cp.execSync(`wmic process where "CommandLine like '%java%%-jar -Dwebdriver.ie.driver=${pltfm}/IEDriverServer_x86.exe -Dwebdriver.gecko.driver=${pltfm}/geckodriver.exe -Dwebdriver.chrome.driver=${pltfm}/chromedriver.exe ${selSettings.jar} -port ${this.availablePort}%'" Call Terminate`, { stdio: 'pipe' });
            } catch (e) {
                console.warn('Failed to kill selenium: ' + e);
            }
        } else {
          try {
            cp.execSync(`pkill -f "java -jar -Dwebdriver.gecko.driver=${pltfm}/geckodriver -Dwebdriver.chrome.driver=${pltfm}/chromedriver ${selSettings.jar} -port ${this.availablePort}"`, { stdio: 'pipe' });
          } catch (e) {
            // ignore. pkill returns 1 status if process doesn't exist
          }
        }
    }

    _startProcess(port) {
        // initialize Selenium server
        const selArgs = [selSettings.jar].concat(selSettings.args);
    
        let geckodriver = null;
        let chromedriver = null;
    
        if (process.platform === 'win32') {
          chromedriver = 'win32/chromedriver.exe';
          geckodriver = 'win32/geckodriver.exe';
        } else if (process.platform === 'darwin') {
          chromedriver = 'darwin/chromedriver';
          geckodriver = 'darwin/geckodriver';
        } else {
          chromedriver = 'linux/chromedriver';
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
        
        const cwd = process.env.NODE_ENV === 'production' ? path.resolve(__dirname, 'selenium') : path.resolve(__dirname, '..', 'selenium');
        this.seleniumProc = cp.spawn('java', selArgs, { cwd, shell: true });
        console.log('Attempting to start Selenium process...');
        this._emitStartedEvent(port);
        this._handleProcessEvents();
    }

    _handleProcessEvents() {
        const proc = this.seleniumProc;
        if (!proc) {
            console.error('Selenium process was not started.');
            return;
        }
        // on 'error'
        proc.on('error', (e) => {
            console.error('Cannot start Selenium process.', e);
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
}
