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
import { app, BrowserWindow, crashReporter } from 'electron';

import Logger from './Logger';
import MainProcess from './MainProcess';
import * as Sentry from '@sentry/electron';
import fs from 'fs';
import path from 'path';
import packageJson from '../../package.json';

console.log('Version: ', packageJson.version);

if (process.env.OXYGEN_IDE_USERDATA_PATH) {
    console.log('Setting custom userData path: ' + process.env.OXYGEN_IDE_USERDATA_PATH);
    app.setPath('userData', process.env.OXYGEN_IDE_USERDATA_PATH);
}

if (process && process.env && process.env.NODE_ENV !== 'development') {
    initializeCrashReporterAndSentry();
}
global.log = new Logger('debug', 'info');

let mainWindow = null;
let mainProc = null;

try {
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
} catch (e) {
    alert('Please, open later (2 sec)');
    console.log(e);

    if (Sentry && Sentry.captureException) {
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
            webSecurity: false,
            nodeIntegration: true
        },
    });

    if (mainWindow) {
        mainWindow.loadURL(`file://${__dirname}/../renderer/app.html`);
    
        mainWindow.webContents.on('did-finish-load', () => {
            if (mainWindow) {
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
        
        try {
            mainProc = new MainProcess(mainWindow);
        } catch (e) {
        
            if (Sentry && Sentry.captureException) {
                console.log('LOCATION : mainProc = new MainProcess(mainWindow)');
                Sentry.captureException(e);
            }
        
            console.log('mainProc e', e);
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
        mainProc.dispose().then(() => app.exit());
        // make sure we set mainProc to null to prevent duplicated calls to this function
        mainProc = null;
    }
}


function normalizeUrl(url) {
    const PATH_MATCH_RE = /[^/]+$/;
    const match = url.match(PATH_MATCH_RE);
    return match ? `~/app/main/${match[0]}` : url;
}

function initializeCrashReporterAndSentry() {
    try {
        crashReporter.start({
            companyName: 'no-company-nc',
            productName: 'ide',
            ignoreSystemCrashHandler: true,
            submitURL: 'https://o4504315553185792.ingest.sentry.io/api/4504315816116224/minidump/?sentry_key=24eaf38a68394ad69198ece9985cabff',
            uploadToServer: true
        });

        const crashesDirectory = crashReporter.getCrashesDirectory();
        const completedDirectory = path.join(crashesDirectory, 'completed');
        const newDirectory = path.join(crashesDirectory, 'new');
        const pendingDirectory = path.join(crashesDirectory, 'pending');
        // make sure crashesDirectory and its sub folders exist, otherwise we will get an error while initializing Sentry
        if (!fs.existsSync(crashesDirectory)) {
            fs.mkdirSync(crashesDirectory);
        }
        if (!fs.existsSync(completedDirectory)) {
            fs.mkdirSync(completedDirectory);
        }
        if (!fs.existsSync(newDirectory)) {
            fs.mkdirSync(newDirectory);
        }
        if (!fs.existsSync(pendingDirectory)) {
            fs.mkdirSync(pendingDirectory);
        }
  
        const sentryConfig = {
            dsn: 'https://24eaf38a68394ad69198ece9985cabff@o4504315553185792.ingest.sentry.io/4504315816116224',
            release: packageJson.version,
            beforeSend(event) {
                // console.log('event', JSON.stringify(event, null, 2));

                if (
                    event &&
                    event.exception &&
                    event.exception.values &&
                    Array.isArray(event.exception.values) &&
                    event.exception.values.length > 0
                ) {
                    for (var i = 0; i < event.exception.values.length; i++) {
                        if (
                            event.exception.values[i] &&
                            event.exception.values[i].stacktrace &&
                            event.exception.values[i].stacktrace.frames &&
                            Array.isArray(event.exception.values[i].stacktrace.frames) &&
                            event.exception.values[i].stacktrace.frames.length > 0
                        ) {
                            for (var j = 0; j < event.exception.values[i].stacktrace.frames.length; j++) {
                                const sepBefore = 'app:///main/';
                                if (
                                    event.exception.values[i].stacktrace.frames[j] &&
                                    event.exception.values[i].stacktrace.frames[j].filename &&
                                    event.exception.values[i].stacktrace.frames[j].filename.startsWith(sepBefore)
                                ) {
                                    event.exception.values[i].stacktrace.frames[j].filename = normalizeUrl(event.exception.values[i].stacktrace.frames[j].filename);
                                }
                            }
                        }
                    }
                }

                return event;
            }
        };

        Sentry.init(sentryConfig);
    } catch (e) {
        console.warn('Cannot initialize CrashReporter and Sentry', e);
    }
}
