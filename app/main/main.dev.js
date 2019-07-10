/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/* eslint global-require: 0, flowtype-errors/show-errors: 0 */

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

import { app, BrowserWindow, globalShortcut } from 'electron';

import Logger from './Logger';
import MainProcess from './MainProcess';
import * as Sentry from '@sentry/electron';
const path = require('path');

try {
  const crashReporter = require('electron').crashReporter;
  crashReporter.start({
    companyName: 'no-company-nc',
    productName: 'ide',
    ignoreSystemCrashHandler: true,
    submitURL: 'https://sentry.io/api/1483628/minidump/?sentry_key=cbea024b06984b9ebb56cffce53e4d2f',
    uploadToServer: true
  });
} catch(e){
  console.warn('crashReporter error', e);
}

Sentry.init({dsn: 'https://cbea024b06984b9ebb56cffce53e4d2f@sentry.io/1483893'});

global.log = new Logger('debug', 'info');

let mainWindow = null;
let mainProc = null;

try{
  const gotTheLock = app.requestSingleInstanceLock()
  
  if (!gotTheLock) {
    app.quit()
  } else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus();
      }
    });
  }
} catch(e){
  alert('Please, open later (2 sec)');
  console.log(e);
}

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
  require('electron-debug')();
  const path = require('path');
  const p = path.join(__dirname, 'node_modules');
  require('module').globalPaths.push(p);
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = [
    'REACT_DEVELOPER_TOOLS',
    'REDUX_DEVTOOLS'
  ];

  return Promise
    .all(extensions.map(name => installer.default(installer[name], forceDownload)))
    .catch(console.log);
};


/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  //if (process.platform !== 'darwin') {
    disposeMainAndQuit(); 
  //}
});

app.on('ready', async () => {
  /*
  if (
    process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }
  */
  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences: {
      webSecurity: false,
      preload: path.join(__dirname, 'sentry.js')
    },
  });

  // Prevent refresh
  // @FIXME: it'll cause preventing refreshesh for all windows
  // https://stackoverflow.com/questions/51187602/electron-js-prevent-refresh-for-created-window
  globalShortcut.register('CommandOrControl+R', () => false);
  globalShortcut.register('F5', () => false);
  mainWindow.loadURL(`file://${__dirname}/../renderer/app.html`);

  // @TODO: Use 'ready-to-show' event
  // https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => {
    disposeMainAndQuit();
  });

  try{
    mainProc = new MainProcess(mainWindow);
  } catch(e){
    console.log('e', e);
  }
});

function disposeMainAndQuit() {
  if (mainProc) {
    // dispose main process and all its services
    mainProc.dispose().then(() => app.quit());
    // make sure we set mainProc to null to prevent duplicated calls to this function
    mainProc = null;
  }
}
