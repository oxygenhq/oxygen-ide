/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron, { app } from 'electron';
import ServiceDispatcher from './services/ServiceDispatcher';

/* eslint-disable class-methods-use-this */
export default class MainProcess {
  constructor(mainWindow) {
    process.env.ELECTRON = true;
    this.mainWindow = mainWindow;
    this.ipc = electron.ipcMain;
    this.serviceDispatcher = new ServiceDispatcher(mainWindow);

    // set default window title
    this.mainWindow.setTitle('Oxygen IDE');
    // start service dispatcher and initialize all available services
    this.serviceDispatcher.start();
    // handle various electron lifecycle events
    this._handleEvents();

    // open dev tools in debug mode
    if (process.env.NODE_ENV !== 'production') {
      // TODO: do not open devtools automatically, rather add this option to the main menu
      //this.mainWindow.webContents.openDevTools();
      this.mainWindow.openDevTools();
    }
  }

  async dispose() {
    await this.serviceDispatcher.dispose();
  }
  
  _handleEvents() {
    /**
     * @param  {Event} 'dom-ready'
     * @param  {function} callback
     * Initialization for renderer process when dom is ready to interract
     */
    this.mainWindow.webContents.once('dom-ready', () => {
      //this.initalizeSeleniumServer();   // FIXME: remove the comment
    });
    
    // App mounted, so now we can listen events
    this.ipc.on('appIsMountedAndReadyToParse', () => {
      //this.mainWindow.setTitle(title);
      // console.log('this.mainWindow.id: ', this.mainWindow.id);
      // 1 always by default
      // console.log(BrowserWindow.fromId(2)); // window | null
    });

    // Clean Listeners, for preventing memeory leaking
    // this.ipc.on('cleanCBListeners', (e, listeners) => {
    //   const { mainWindow: { webContents } } = this;
    //   if (listeners.length > 0) {
    //     listeners.forEach((listener) => {
    //       webContents.removeListener(listener, () => {});
    //     });
    //   }
    // });
  }

  debugLog() {
    console.log('Main process has started -> ');
  }
}
