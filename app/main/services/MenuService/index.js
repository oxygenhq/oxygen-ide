/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron, { BrowserWindow } from 'electron';
const os = require('os');
const path = require('path');
import ServiceBase from "../ServiceBase";
import menuTemplate from './menuTemplate';
import menuTemplateFromArray from './menuTemplateFromArray';
import * as Const from '../../../const';

import pkgInfo from '../../../../package.json';
import pkgNativeInfo from '../../../package.json';

const { Menu } = electron;
const MAIN_MENU_CMD = 'MAIN_MENU_CMD';

const DEFAULT_MENU_STATE = {
    [Const.MENU_CMD_VIEW_EVENT_LOG]: {
        selected: true,
    },
};

const chromeVersion = () => {
    return new Promise(function(resolve, reject) {
      if (os.platform() === 'win32') {
        try {
          const process = require('child_process');   
          const spawn = process.spawn(path.resolve(__dirname, 'get_chrome_versions.bat'));
          spawn.on('error', function(err){
            console.log('error', err);
            reject(err);
          });

          let infoArray;

          spawn.stdout.on('data', function (data) {
            try {
              let cmdOut = data.toString().split('\n');
              if(Array.isArray(cmdOut) && cmdOut.length > 2){
                infoArray = cmdOut.filter(function (el) {
                    if(el && el.length){
                        return el.length > 1;
                    }
                });
              }
            } catch(e){
              console.log('e', e);
              reject(e);
            }
          });
          spawn.on('close', function (code) {
              try{
                if (code == 0){
                    console.log('code 0');
                }
                else {
                    if(
                        infoArray &&
                        Array.isArray(infoArray) &&
                        infoArray.length
                    ){
                        const lineWithVersion = infoArray[infoArray.length - 1];
        
                        if(
                            lineWithVersion && 
                            Array.isArray(infoArray) &&
                            lineWithVersion.split
                        ){
                            const lineWithVersionSplit = lineWithVersion.split(' ');
            
                            if(
                                lineWithVersionSplit &&
                                Array.isArray(lineWithVersionSplit) && 
                                lineWithVersionSplit.length
                            ){
                                resolve(lineWithVersionSplit[lineWithVersionSplit.length - 1]);
                                spawn.kill();
                            } else {
                                resolve('not found');
                            }
                        } else {
                            resolve('not found');
                        }
                    } else {
                        resolve('not found');
                    }
                }
              } catch(e){
                  console.log('e', e);
                  reject(e);
              }
          });
        } catch(e){
          console.log('e', e);
          reject(e);
        }
      } else if(os.platform() === 'darwin') {
        try {
          const spawn = require('child_process').spawn('/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome', ['--version']);
          spawn.on('error', function(err){
            console.log('error', err);
            reject(err);
          });
    
          spawn.stdout.on('data', function (data) {
            try{
              let cmdOut = data.toString().split('\n');
      
              if(cmdOut && cmdOut[0]){
                const ArrFromStrWithChromeVersion = cmdOut[0].trim().split(' ');
                if(Array.isArray(ArrFromStrWithChromeVersion) && ArrFromStrWithChromeVersion.length && ArrFromStrWithChromeVersion.length === 3){
                    resolve(ArrFromStrWithChromeVersion[2]);
                } else {
                    resolve('not found');
                }
              } else {
                resolve('not found');
              }
            } catch(e){
              console.log('e', e);
              reject(e);
            }
          });
        } catch(e){
          console.log('e', e);
          reject(e);
        }
      }
    });

  }

export default class MenuService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
        // initialize Main Menu
        const template = menuTemplate(::this._handleMenuCommand, DEFAULT_MENU_STATE);
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    popup(menuItems, options) {
        const template = menuTemplateFromArray(::this._handleMenuCommand, menuItems);
        const menu = Menu.buildFromTemplate(template);
        menu.popup({
            ...(options || {}),
            window: BrowserWindow.getFocusedWindow(),
        });
    }

    update(settings = DEFAULT_MENU_STATE) {
        const template = menuTemplate(::this._handleMenuCommand, settings);
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
        /*let prepareRecent = uniq(
            [
              latestSelectedFile.path,
              ...this.recentFiles,
            ]
        );
        if (prepareRecent.length > 5) {
            prepareRecent = prepareRecent.slice(0, 5);
        }*/
    }

    async _handleMenuCommand(cmd, ...args) {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        let notify = true;

        if (cmd === Const.MENU_CMD_VIEW_DEVTOOLS) {
            this.mainWindow.openDevTools();
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_COPY) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.copy()
            }
            else {
                focusedWindow.webContents.copy();
            }
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_PASTE) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.paste()
            }
            else {
                focusedWindow.webContents.paste();
            }
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_CUT) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.cut()
            }
            else {
                focusedWindow.webContents.cut();
            }
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_SELECT_ALL) {
            focusedWindow.webContents.selectAll();
        }
        else if (cmd === Const.MENU_CMD_DELETE) {
            focusedWindow.webContents.delete();
        }
        else if (cmd === Const.MENU_CMD_UNDO) {
            focusedWindow.webContents.undo();
        }
        else if (cmd === Const.MENU_CMD_REDO) {
            focusedWindow.webContents.redo();
        }
        else if (cmd === Const.MENU_CMD_HELP_SHOW_DOCS) {
            electron.shell.openExternal('http://docs.oxygenhq.org');
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_HELP_COMMUNITY) {
            electron.shell.openExternal('http://discuss.oxygenhq.org');
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_HELP_REPORT_ISSUE) {
            electron.shell.openExternal('https://github.com/oxygenhq/oxygen-ide/issues');
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_HELP_CONTRIBUTE) {
            electron.shell.openExternal('https://github.com/oxygenhq/oxygen/blob/master/CONTRIBUTE.md');
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_HELP_GO_PRO) {
            electron.shell.openExternal('http://cloudbeat.io');
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_HELP_SHOW_ABOUT) {

            // var chromeVer = 'not found';
            // try {
            //     const result = await chromeVersion();
                
            //     if(result){
            //         chromeVer = result;
            //     }
            // } catch(e){
            //     console.log('e',e);
            // }

            var oxVersion = pkgNativeInfo.dependencies['oxygen-cli'];
            var details = 'Oxygen: ' + (oxVersion.startsWith('git') ? oxVersion.substring(oxVersion.length - 40) : oxVersion) + '\n' +
                    'Electron: ' + process.versions.electron + '\n' +
                    'Node: ' + process.versions.node + '\n' +
                    'Architecture: ' + process.arch + '\n'
            electron.dialog.showMessageBox({
                type: 'info', 
                title: pkgInfo.productName, 
                message: pkgInfo.productName + ' ' + pkgInfo.version,
                detail: details
            });
            notify = false;
        }

        if (notify) {
            this.notify({
                type: MAIN_MENU_CMD,
                cmd: cmd,
                args: args,
            });
        }
    }
}
