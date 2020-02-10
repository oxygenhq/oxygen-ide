/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as Const from '../../../const';
import { app } from 'electron';
import * as Sentry from '@sentry/electron';
/**
 * @param  {Function} cmdHandler - function that will handle menu command
 * @param  {Object} settings - a set of settings for selected menu items
 */
export default (cmdHandler, settings) => {
    const template = [];

    const fileMenu = [
        {
            label: '&New File...',
            accelerator: 'CommandOrControl+N',
            click() { cmdHandler(Const.MENU_CMD_NEW_FILE); }
        },
        {
            label: '&Open File...',
            click() { cmdHandler(Const.MENU_CMD_OPEN_FILE); }
        },
        {
            label: '&Open Folder...',
            accelerator: 'CommandOrControl+O',
            click() { cmdHandler(Const.MENU_CMD_OPEN_FOLDER); }
        },
        {
            type: 'separator'
        },
        {
            label: '&Save',
            accelerator: 'CommandOrControl+S',
            enabled: true,
            click() { cmdHandler(Const.MENU_CMD_SAVE); }
        },
        {
            label: 'Save As...',
            accelerator: 'CommandOrControl+Shift+S',
            click() { cmdHandler(Const.MENU_CMD_SAVE_AS); }
        },
        {
            type: 'separator'
        },
        {
            label: 'Reset IDE state',
            click() { cmdHandler(Const.MENU_CMD_CLEAR_ALL); }
        },
        {
            label: '&Close',
            accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4',
            click() {
                try {
                    app.exit();
                } catch (e) {
                    console.warn(e.message);
                    Sentry.captureException(e);
                }
            }
        },
    ];

    // insert Recet Files/Dirs after Open menu entry
    /*
  const recFiles = recentFiles.length ?
    recentFiles.map((item) => ({
      label: item,
      click() { cmdHandler(Const.MENU_CMD_OPEN_FILE, item) }
    })) : [];
  const recDirs = recentFolders.length ?
    recentFolders.map((item) => ({
      label: item,
      click() { cmdHandler(Const.MENU_CMD_OPEN_FOLDER, item) }
    })) : [];
  fileMenu.splice(2, 0, {
    label: '&Open Recent',
    submenu: [
      {
        label: 'Folders'
      },
      ...recDirs,
      {
        type: 'separator'
      },
      {
        label: 'Files',
      },
      ...recFiles,
    ]
  });
  */

    template.push({
        label: '&File',
        submenu: fileMenu
    });

    template.push({
        label: 'E&dit',
        submenu: [
            {
                label: '&Undo',
                accelerator: 'CommandOrControl+Z',
                click() { cmdHandler(Const.MENU_CMD_UNDO); }
            },
            {
                label: '&Redo',
                accelerator: 'CommandOrControl+Y',
                click() { cmdHandler(Const.MENU_CMD_REDO); }
            },
            { type: 'separator' },
            { 
                role: 'cut',
                click() { cmdHandler(Const.MENU_CMD_CUT); },
            },
            {
                role: 'copy',
                click() { cmdHandler(Const.MENU_CMD_COPY); },
            },
            {
                role: 'paste',
                click() { cmdHandler(Const.MENU_CMD_PASTE); },
            },
        ]
    });
    template.push({
        label: '&Search',
        submenu: [
            {
                label: '&Find',
                accelerator: 'CommandOrControl+F',
                click() { cmdHandler(Const.MENU_CMD_FIND); }
            },
            {
                label: '&Replace',
                accelerator: 'CommandOrControl+H',
                click() { cmdHandler(Const.MENU_CMD_REPLACE); }
            }
        ]
    });
    const viewEventLogChecked = _isSelected(Const.MENU_CMD_VIEW_EVENT_LOG, settings);
    template.push({
        label: '&View',
        submenu: [
            {
                label: 'Zoom In',
                click() { cmdHandler(Const.MENU_CMD_VIEW_ZOOM_IN); }
            },
            {
                label: 'Zoom Out',
                click() { cmdHandler(Const.MENU_CMD_VIEW_ZOOM_OUT); }
            },
            {
                label: 'Zoom to default',
                click() { cmdHandler(Const.MENU_CMD_VIEW_ZOOM_TO_DEFAULT); }
            },
            {
                label: 'Settings...',
                click() { cmdHandler(Const.MENU_CMD_VIEW_SETTINGS); }
            },
            {
                label: 'Event Log',
                accelerator: 'CommandOrControl+Shift+L',
                type: 'checkbox',
                checked: viewEventLogChecked,
                click() { cmdHandler(Const.MENU_CMD_VIEW_EVENT_LOG, !viewEventLogChecked); }
            },
            {
                label: 'DevTools',
                accelerator: 'CommandOrControl+Shift+I',
                // visible: process.env.NODE_ENV !== 'production',
                click() { cmdHandler(Const.MENU_CMD_VIEW_DEVTOOLS); }
            }
        ]
    });
    template.push({
    //label: 'Help',
        role: 'help',
        submenu: [
            {
                label: 'Documentation',
                click() { cmdHandler(Const.MENU_CMD_HELP_SHOW_DOCS); }
            },
            {
                type: 'separator'
            },
            {
                label: 'Get Community Help',
                click() { cmdHandler(Const.MENU_CMD_HELP_COMMUNITY); }
            },
            {
                label: 'Report an Issue',
                click() { cmdHandler(Const.MENU_CMD_HELP_REPORT_ISSUE); }
            },
            {
                label: 'Contribute',
                click() { cmdHandler(Const.MENU_CMD_HELP_CONTRIBUTE); }
            },
            {
                label: 'Go Professional',
                click() { cmdHandler(Const.MENU_CMD_HELP_GO_PRO); }
            },
            {
                type: 'separator'
            },
            {
                label: 'About',
                click() { cmdHandler(Const.MENU_CMD_HELP_SHOW_ABOUT); }
            },
            {
                label: 'Check for Updates...',
                click() { cmdHandler(Const.MENU_CMD_HELP_CHECK_UPDATES); }
            },
            {
                label: 'Open Log file',
                click() { cmdHandler(Const.MENU_CMD_OPEL_LOG_FILE); }
            }
        ]
    });

    return template;
};

// function _isEnabled(ctrlId, settings) {
//     const state = settings && settings.hasOwnProperty(ctrlId) ? settings[ctrlId] : null;
//     if (state && state.hasOwnProperty('enabled')) {
//         return state.enabled;
//     }
//     return true;
// }

// function _isVisible(ctrlId, settings) {
//     const state = settings && settings.hasOwnProperty(ctrlId) ? settings[ctrlId] : null;
//     if (state && state.hasOwnProperty('visible')) {
//         return state.visible;
//     }
//     return true;
// }

function _isSelected(ctrlId, settings) {
    const state = settings && settings.hasOwnProperty(ctrlId) ? settings[ctrlId] : null;
    if (state && state.hasOwnProperty('selected')) {
        return state.selected;
    }
    return true;
}
