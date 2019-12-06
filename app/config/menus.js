/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as Const from '../const';

const CONTEXT_MENU_FILE_EXPLORER_FOLDER = [
    {
        label: 'New File',
        accelerator: 'CommandOrControl+N',
        cmd: Const.MENU_CMD_NEW_FILE,
    },
    {
        label: 'New Folder',
        cmd: Const.MENU_CMD_NEW_FOLDER,
    },
    {
        type: 'separator',
    },
    {
        label: 'Rename',
        cmd: Const.MENU_CMD_RENAME_FOLDER,
    },
    {
        label: 'Delete',
        cmd: Const.MENU_CMD_DELETE_FOLDER,
    },
];

const CONTEXT_MENU_FILE_EXPLORER_FILE = [
    {
        label: 'Rename',
        cmd: Const.MENU_CMD_RENAME_FILE,
    },
    {
        label: 'Delete',
        cmd: Const.MENU_CMD_DELETE_FILE,
    },
];

const CONTEXT_MENU_OBJECT_REPOSITORY_FILE_EXPLORER_FILE = [
    {
        label: 'Open',
        cmd: Const.MENU_CMD_OPEN_OR_FILE,
    },
    {
        label: 'Rename',
        cmd: Const.MENU_CMD_RENAME_FILE,
    },
    {
        label: 'Delete',
        cmd: Const.MENU_CMD_DELETE_FILE,
    },
];

const CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_ELEMENT = [
    {
        label: 'Rename',
        cmd: Const.MENU_CMD_ORE_RENAME_ELEMENT,
    },
    {
        label: 'Delete',
        cmd: Const.MENU_CMD_ORE_DELETE_ELEMENT,
    }
];

const CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_CONTAINER = [
    {
        label: 'New Container',
        cmd: Const.MENU_CMD_ORE_NEW_CONTAINER,
    },
    {
        label: 'New Element',
        cmd: Const.MENU_CMD_ORE_NEW_ELEMENT,
    },
    {
        type: 'separator',
    },
    {
        label: 'Rename',
        cmd: Const.MENU_CMD_ORE_RENAME_CONTAINER,
    },
    {
        label: 'Delete',
        cmd: Const.MENU_CMD_ORE_DELETE_CONTAINER,
    }
];

module.exports = {
    CONTEXT_MENU_FILE_EXPLORER_FOLDER: CONTEXT_MENU_FILE_EXPLORER_FOLDER,
    CONTEXT_MENU_FILE_EXPLORER_FILE: CONTEXT_MENU_FILE_EXPLORER_FILE,
    CONTEXT_MENU_OBJECT_REPOSITORY_FILE_EXPLORER_FILE: CONTEXT_MENU_OBJECT_REPOSITORY_FILE_EXPLORER_FILE,
    CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_ELEMENT: CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_ELEMENT,
    CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_CONTAINER: CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_CONTAINER
};
