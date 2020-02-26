/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron from 'electron';
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

        // open dev tools in debug mode
        if (process.env.NODE_ENV !== 'production') {
            this.mainWindow.openDevTools();
        }
        console.log('Main process has started');
    }

    async dispose() {
        await this.serviceDispatcher.dispose();
    }
}
