/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build-main`, this file is compiled to
 * `./app/main/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import { app, BrowserWindow, globalShortcut, crashReporter } from 'electron';

import Logger from './Logger';
import MainProcess from './MainProcess';
import * as Sentry from '@sentry/electron';
import fs from 'fs';
import path from 'path';
import packageJson from '../../package.json';

console.log('Version: ', packageJson.version);

if (process && process.env && process.env.NODE_ENV !== 'development') {
    initializeCrashReporterAndSentry();
}
global.log = new Logger('debug', 'info');

let mainWindow = null;
let mainProc = null;

try{
    const gotTheLock = app.requestSingleInstanceLock();
  
    if (!gotTheLock) {
        app.exit();
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            if (mainWindow) {
                if (mainWindow.isMinimized()) mainWindow.restore();
                mainWindow.focus();
            }
        });
    }
} catch(e){
    alert('Please, open later (2 sec)');
    console.log(e);

    if(Sentry && Sentry.captureException){
        Sentry.captureException(e);
    }
}

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
    require('electron-debug')();
    const p = path.join(__dirname, 'node_modules');
    require('module').globalPaths.push(p);
}

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    disposeMainAndQuit(); 
});

app.on('ready', async () => {
    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: 728,
        webPreferences: {
            webSecurity: false
        },
    });

    if(mainWindow){
        // Prevent refresh
        // @FIXME: it'll cause preventing refreshesh for all windows
        // https://stackoverflow.com/questions/51187602/electron-js-prevent-refresh-for-created-window
        globalShortcut.register('CommandOrControl+R', () => false);
        globalShortcut.register('F5', () => false);
        mainWindow.loadURL(`file://${__dirname}/../renderer/app.html`);
    
        mainWindow.webContents.on('did-finish-load', () => {
            if(mainWindow){
                mainWindow.show();
                mainWindow.focus();
            }
        });

        mainWindow.webContents.on('destroyed', () => {
            disposeMainAndQuit();
        });
    
        mainWindow.on('closed', () => {
            disposeMainAndQuit();
        });
        
        try{
            mainProc = new MainProcess(mainWindow);
        } catch(e){
        
            if(Sentry && Sentry.captureException){
                console.log('LOCATION : mainProc = new MainProcess(mainWindow)');
                Sentry.captureException(e);
            }
        
            console.log('e', e);
        }
    }

});

app.on('unresponsive', () => {
    require('dialog').showMessageBox({
        type: 'info',
        message: 'Reload window?',
        buttons: ['Cancel', 'Reload']
    });
});

function disposeMainAndQuit() {
    mainWindow = null;

    if (mainProc) {
        // dispose main process and all its services
        /*eslint-disable */
        mainProc.dispose().then(() => app.exit());
        /*eslint-enable */
        // make sure we set mainProc to null to prevent duplicated calls to this function
        mainProc = null;
    }
}

function initializeCrashReporterAndSentry() {
    try {
        crashReporter.start({
            companyName: 'no-company-nc',
            productName: 'ide',
            ignoreSystemCrashHandler: true,
            submitURL: 'https://sentry.io/api/1483628/minidump/?sentry_key=cbea024b06984b9ebb56cffce53e4d2f',
            uploadToServer: true
        });

        const crashesDirectory = crashReporter.getCrashesDirectory();
        const completedDirectory = path.join(crashesDirectory, 'completed');
        const newDirectory = path.join(crashesDirectory, 'new');
        const pendingDirectory = path.join(crashesDirectory, 'pending');
        // make sure crashesDirectory and its sub folders exist, otherwise we will get an error while initializing Sentry
        if (!fs.existsSync(crashesDirectory)){
            fs.mkdirSync(crashesDirectory);
        }
        if (!fs.existsSync(completedDirectory)){
            fs.mkdirSync(completedDirectory);
        }
        if (!fs.existsSync(newDirectory)){
            fs.mkdirSync(newDirectory);
        }
        if (!fs.existsSync(pendingDirectory)){
            fs.mkdirSync(pendingDirectory);
        }
  
        const sentryConfig = {
            dsn: 'https://cbea024b06984b9ebb56cffce53e4d2f@sentry.io/1483893',
            release: packageJson.version
        };

        Sentry.init(sentryConfig);
    } catch(e) {
        console.warn('Cannot initialize CrashReporter and Sentry', e);
    }
}
