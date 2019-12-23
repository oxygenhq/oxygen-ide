/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron from 'electron'; 
import appSettings from 'electron-settings';
import { spawn  } from 'child_process';
import ServiceBase from './ServiceBase';
var decache = require('decache');
var path = require('path');

const { dialog } = electron;

export default class ElectronService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
    }

    replaceBackslash(moduleName){
        return new Promise((resolve, reject) => {
            try{                
                const pathToFile = __dirname+path.sep+'services'+path.sep+'backslash.js';
                
                const cp = spawn('node', [pathToFile, moduleName]);
            
                cp.stderr.on('data', (stderr) => {
                    console.log('replaceBackslash stderr', stderr);
                    if(stderr.toString()){
                        console.log('replaceBackslash stderr.toString()', stderr.toString());
                        resolve(stderr.toString());
                    } else {
                        reject(stderr);
                    }
                });
            
                cp.stdout.on('data', (stdout) => {
                    if(stdout && stdout.toString()){
                        resolve(stdout.toString());
                    } else {
                        reject();
                    }
                    
                });
            } catch(e){
                console.log('e', e);
                reject(e);
            }
        });
    }

    require(moduleName){
        return new Promise((resolve, reject) => {
            try{                
                const pathToFile = __dirname+path.sep+'services'+path.sep+'require.js';
                
                const cp = spawn('node', [pathToFile, moduleName]);
            
                cp.stderr.on('data', (stderr) => {
                    console.log('require stderr', stderr);
                    if(stderr.toString()){
                        console.log('require stderr.toString()', stderr.toString());
                        resolve(stderr.toString());
                    } else {
                        reject(stderr);
                    }
                });
            
                cp.stdout.on('data', (stdout) => {
                    if(stdout && stdout.toString()){
                        resolve(stdout.toString());
                    } else {
                        reject();
                    }
                    
                });
            } catch(e){
                console.log('e', e);
                reject(e);
            }
        });
    }

    async orgRequire(moduleName) {
        if (process.platform === 'win32') {
            if(process.env.NODE_ENV === 'development'){
                decache(moduleName);
                return require(moduleName);
            } else {
                try{
                    let newModuleName = await this.replaceBackslash(moduleName);
                    
                    if(newModuleName){
                        newModuleName = newModuleName.slice(0, -1);
                        decache(newModuleName);

                        try{
                            const requireResult = await this.require(newModuleName);
                            return requireResult;
                        } catch(e){
                            console.log('orgRequire win32 e2', e);
                        }
                    }
                } catch(e){
                    console.log('orgRequire win32 e', e);
                }
            }
        } else  {
            decache(moduleName);
            return require(moduleName);
        }
        

    }

    addFile(key, name, content = ''){
        const settings = appSettings.get('appSettings');

        const newSettings = { ...settings };
        if(key, name){
            newSettings.files = {
                ...newSettings.files,
                [key+name] : {
                    content: content,
                    ext: '.js',
                    name: name,
                    path: key,
                    type: 'file'
                }
            };
        } else {
            return null;
        }

        appSettings.set('appSettings', newSettings);
        
        return newSettings;
    }

    removeFile(key, name){
        const settings = appSettings.get('appSettings');

        const newSettings = { ...settings };
        if(key && name){
            let filesCopy = { ... newSettings.files };
            
            delete filesCopy[key+name];

            newSettings.files = filesCopy;
        } else {
            return null;
        }

        appSettings.set('appSettings', newSettings);
        
        return newSettings;
    }

    updateFileContent(key, name, content = ''){
        const settings = appSettings.get('appSettings');

        const newSettings = { ...settings };
        if(key && name && typeof content !== 'undefined'){
            newSettings.files = {
                ...newSettings.files,
                [key+name] : {
                    ...newSettings.files[key+name],
                    content: content
                }
            };
        } else {
            return null;
        }

        appSettings.set('appSettings', newSettings);
        
        return newSettings;
    }

    updateCache(cache) {
        if(cache){
            const settings = appSettings.get('appSettings');
            
            const newSettings = settings;

            newSettings.cache = cache;
    
            appSettings.set('appSettings', newSettings);
    
            return newSettings;
        } else {
            return;
        }
    }

    clearSettings() {
        appSettings.deleteAll();

        const settings = appSettings.get('appSettings');
        return settings;
    }

    getSettings() {
        const settings = appSettings.get('appSettings');
        return settings;
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
