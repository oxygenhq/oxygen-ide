/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron, { app } from 'electron'; 
import appSettings from 'electron-settings';

import ServiceBase from "./ServiceBase";

const { dialog } = electron;

export default class ElectronService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
    }

    getSettings() {
        return appSettings.get('appSettings');
    }

    updateSettings(settings) {
        appSettings.set('appSettings', settings);
    }

    setTitle(title) {
        this.mainWindow.setTitle(title);
    }

    showSaveDialog(title = null, defaultPath = null, filters = null) {
        return new Promise((resolve, reject) => {
            const options = {
                title,
                defaultPath,
                filters
            };
            dialog.showSaveDialog(
                this.mainWindow, 
                options, 
                (savedFilePath) => resolve(savedFilePath)
            );
        });
    }
    showOpenDialog(dialogType = 'openFile', multiSelections = false) {
        return new Promise((resolve, reject) => {
            dialog.showOpenDialog(this.mainWindow, 
                {
                    properties: [
                        dialogType,
                        multiSelections ? 'multiSelections' : null,
                    ],
                }, 
                (selectedPaths) => resolve(selectedPaths)
            );
        });
    }

    showOpenFileDialog() {
        return this.showOpenDialog('openFile', true);
    }

    showOpenFolderDialog() {
        return this.showOpenDialog('openDirectory');
    }

    showErrorBox(title, message) {
        dialog.showErrorBox(title, message);
    }

    shellOpenExternal(url, options = null) {
        electron.shell.openExternal(url, options);
    }
    
}
