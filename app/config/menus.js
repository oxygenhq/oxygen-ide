/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as Const from '../const';

export const CONTEXT_MENU_FILE_EXPLORER_FOLDER = [
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

export const CONTEXT_MENU_FILE_EXPLORER_FILE = [
	{
		label: 'Rename',
		cmd: Const.MENU_CMD_RENAME_FILE,
	},
	{
		label: 'Delete',
		cmd: Const.MENU_CMD_DELETE_FILE,
	},
];

export const CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_OBJECT = [
	{
		label: 'Copy Object',
		cmd: Const.MENU_CMD_ORE_COPY_OBJECT,
	},
];

export const CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_FOLDER = [
	{
		label: 'New Object',
		cmd: Const.MENU_CMD_ORE_NEW_OBJECT,
	},
	{
		label: 'New Folder',
		cmd: Const.MENU_CMD_ORE_NEW_FOLDER,
	}
];
