/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import moment from 'moment';

import * as ActionTypes from './types';
import { success, failure } from '../../helpers/redux';

/* set font size to settings */
export const saveSettings = () => ({
  type: ActionTypes.SAVE_SETTINGS,
});

/* openFile */
export const openFile = (path, setActive = true) => ({
  type: ActionTypes.EDITOR_OPEN_FILE,
  payload: { path, setActive },
});
export const _openFile_Success = (path) => ({
  type: success(ActionTypes.EDITOR_OPEN_FILE),
  payload: { path },
});
export const _openFile_Failure = (path, error) => ({
  type: failure(ActionTypes.EDITOR_OPEN_FILE),
  payload: { path, error },
});

/* closeFile */
export const closeFile = (path, setActive = true, name = null) => ({
  type: ActionTypes.EDITOR_CLOSE_FILE,
  payload: { path, name },
});
export const _closeFile_Success = (path) => ({
  type: success(ActionTypes.EDITOR_CLOSE_FILE),
  payload: { path },
});
export const _closeFile_Failure = (path, error) => ({
  type: failure(ActionTypes.EDITOR_CLOSE_FILE),
  payload: { path, error },
});

/* setActiveFile */
export const setActiveFile = (path, name = null) => ({
  type: ActionTypes.EDITOR_SET_ACTIVE_FILE,
  payload: { path, name },
});

/* setActiveLine */
export const setActiveLine = (time, path, line) => ({
  type: ActionTypes.EDITOR_SET_ACTIVE_LINE,
  payload: { time: time || moment.utc().unix(), path, line },
});

/* setActiveLine */
export const renameFile = (oldPath, newPath) => ({
  type: ActionTypes.EDITOR_RENAME_FILE,
  payload: { path: oldPath, newPath },
});

/* resetActiveLines */
export const resetActiveLines = () => ({
  type: ActionTypes.EDITOR_RESET_ACTIVE_LINES,
  payload: null,
});

/* addFile */
export const addFile = (path, name = null) => ({
  type: ActionTypes.EDITOR_ADD_FILE,
  payload: { path, name },
});

/* updateFileBreakpoints */
export const updateFileBreakpoints = (path, breakpoints) => ({
  type: ActionTypes.EDITOR_UPDATE_FILE_BREAKPOINTS,
  payload: { file, breakpoints },
});

export const setEditorInstance = (data) => ({
  type: ActionTypes.EDITOR_INSTANCE,
  payload: data,
});

export const setRootForNewFile = (path) => ({
  type: ActionTypes.NEW_FILE_PATH,
  payload: path,
});

export const changeToolbarButtonsState = (buttonsState) => ({
  type: ActionTypes.TOOLBAR_BUTTONS_STATE,
  payload: buttonsState,
});
