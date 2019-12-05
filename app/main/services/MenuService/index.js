/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import electron from 'electron';
import ServiceBase from '../ServiceBase';
import menuTemplate from './menuTemplate';
import menuTemplateFromArray from './menuTemplateFromArray';
import * as Const from '../../../const';

import pkgInfo from '../../../../package.json';
import pkgNativeInfo from '../../../package.json';

const { Menu, BrowserWindow } = electron;
const MAIN_MENU_CMD = 'MAIN_MENU_CMD';

const DEFAULT_MENU_STATE = {
    [Const.MENU_CMD_VIEW_EVENT_LOG]: {
        selected: true,
    },
};

export default class MenuService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
        // initialize Main Menu
        const template = menuTemplate(this._handleMenuCommand, DEFAULT_MENU_STATE);
        const menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    }

    popup(menuItems, options) {
        const template = menuTemplateFromArray(this._handleMenuCommand, menuItems);
        const menu = Menu.buildFromTemplate(template);
        menu.popup({
            ...(options || {}),
            window: BrowserWindow.getFocusedWindow(),
        });
    }

    update(settings = DEFAULT_MENU_STATE) {
        const template = menuTemplate(this._handleMenuCommand, settings);
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

    _handleMenuCommand = (cmd, ...args) => {
        const focusedWindow = BrowserWindow.getFocusedWindow();
        let notify = true;

        if (cmd === Const.MENU_CMD_VIEW_DEVTOOLS) {
            this.mainWindow.openDevTools();
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_COPY) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.copy();
            }
            else {
                focusedWindow.webContents.copy();
            }
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_PASTE) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.paste();
            }
            else {
                focusedWindow.webContents.paste();
            }
            notify = false;
        }
        else if (cmd === Const.MENU_CMD_CUT) {
            if (this.mainWindow.webContents.isDevToolsFocused()) {
                this.mainWindow.webContents.devToolsWebContents.cut();
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
            var oxVersion = pkgNativeInfo.dependencies['oxygen-cli'];
            var details = 'Oxygen: ' + (oxVersion.startsWith('git') ? oxVersion.substring(oxVersion.length - 40) : oxVersion) + '\n' +
                    'Electron: ' + process.versions.electron + '\n' +
                    'Node: ' + process.versions.node + '\n' +
                    'Architecture: ' + process.arch + '\n';
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
