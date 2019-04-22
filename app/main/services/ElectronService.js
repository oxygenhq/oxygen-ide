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
    
    addFile(key, name){
        const settings = appSettings.get('appSettings');

        const newSettings = { ...settings };
        if(key, name){
            newSettings.files = {
                ...newSettings.files,
                [key+name] : {
                    content: '',
                    ext: ".js",
                    name: name,
                    path: key,
                    type: "file"
                }
            }
        } else {
            return null;
        }

        appSettings.set('appSettings', newSettings);
        
        return newSettings;
    }

    updateFileContent(key, name, content){
        const settings = appSettings.get('appSettings');

        const newSettings = { ...settings };
        if(key, name, content){
            newSettings.files = {
                ...newSettings.files,
                [key+name] : {
                    ...newSettings.files[key+name],
                    content: content
                }
            }
        } else {
            return null;
        }

        appSettings.set('appSettings', newSettings);
        
        return newSettings;
    }

    updateCache(cache) {
        if(cache){
            const settings = appSettings.get('appSettings');
            
            const newSettings = { ...settings };

            newSettings.cache = cache;
    
            appSettings.set('appSettings', newSettings);
    
            return 'success';
        } else {
            return 'fail';
        }
    }

    clearSettings() {
        appSettings.deleteAll();
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
    showOpenDialog(dialogType = 'openFile', multiSelections = false, filters = null) {
        return new Promise((resolve, reject) => {
            dialog.showOpenDialog(this.mainWindow, 
                {
                    properties: [
                        dialogType,
                        multiSelections ? 'multiSelections' : null,
                    ],
                    filters: filters
                },
                (selectedPaths) => resolve(selectedPaths)
            );
        });
    }

    showOpenFileDialog(filters = null) {
        return this.showOpenDialog('openFile', true, filters);
    }

    showOpenFolderDialog() {
        return this.showOpenDialog('openDirectory');
    }

    showMessageBox(title, message, buttons) {
        return new Promise((resolve, reject) => {
            dialog.showMessageBox({
                type: 'warning',
                buttons: buttons,
                title: title,
                message: message
            },(response) => {
                resolve(response);
            });
        });
    }

    showConfirmFileChangeBox(title, message, buttons) {
        return this.showMessageBox(title, message, buttons);
    }

    showErrorBox(title, message) {
        dialog.showErrorBox(title, message);
    }

    shellOpenExternal(url, options = null) {
        electron.shell.openExternal(url, options);
    }
}
