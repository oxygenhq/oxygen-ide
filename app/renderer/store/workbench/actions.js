/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
import { success, failure } from '../../helpers/redux';

export const initialize = () => {
  return {
    type: ActionTypes.WB_INIT,
    payload: null,
  };
};
/* openFile */
export const openFile = (path) => {
  return {
    type: ActionTypes.WB_OPEN_FILE,
    payload: { path },
  }
};
export const _openFile_Success = (path) => {
  return {
    type: success(ActionTypes.WB_OPEN_FILE),
    payload: { path },
  }
};
export const _openFile_Failure = (path, error) => {
  return {
    type: failure(ActionTypes.WB_OPEN_FILE),
    payload: { path, error },
  }
};

/* closeFile */
export const closeFile = (path, force = false) => {
  return {
    type: ActionTypes.WB_CLOSE_FILE,
    payload: { path, force },
  };
};

export const _closeFile_Success = (path) => {
  return {
    type: success(ActionTypes.WB_CLOSE_FILE),
    payload: { path },
  };
};

/* closeAllFiles */
export const closeAllFiles = (force = false) => {
  return {
    type: ActionTypes.WB_CLOSE_ALL_FILES,
    payload: { force: force },
  };
};


/* deleteFile */
export const deleteFile = (path) => {
  return {
    type: ActionTypes.WB_DELETE_FILE,
    payload: { path },
  };
};

export const _deleteFile_Success = (path) => {
  return {
    type: success(ActionTypes.WB_DELETE_FILE),
    payload: { path },
  };
};

export const _deleteFile_Failure = (path) => {
  return {
    type: failure(ActionTypes.WB_DELETE_FILE),
    payload: { path },
  };
};

/* openFolder */
export const openFolder = (path) => {
  return {
    type: ActionTypes.WB_OPEN_FOLDER,
    payload: { path },
  };
};
/* createFile */
export const createFile = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_FILE,
    payload: { path, name },
  };
};
export const _createFile_Success = (path, name) => {
  return {
    type: success(ActionTypes.WB_CREATE_FILE),
    payload: { path, name },
  };
};
export const _createFile_Failure = (path, name, error) => {
  return {
    type: failure(ActionTypes.WB_CREATE_FILE),
    payload: { path, name, error },
  };
};
/* createFolder */
export const createFolder = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_FOLDER,
    payload: { path, name },
  };
};
export const _createFolder_Success = (path, name) => {
  return {
    type: success(ActionTypes.WB_CREATE_FOLDER),
    payload: { path, name },
  };
};
export const _createFolder_Failure = (path, name, error) => {
  return {
    type: failure(ActionTypes.WB_CREATE_FOLDER),
    payload: { path, name, error },
  };
};
/* renameFile */
export const renameFile = (path, newName) => {
  return {
    type: ActionTypes.WB_RENAME_FILE,
    payload: { path, newName },
  };
};
/* saveCurrentFile */
export const saveCurrentFile = (prompt = false) => ({
  type: ActionTypes.WB_SAVE_CURRENT_FILE,
  payload: { prompt },
});
/* showDialog */
export const showDialog = (dialog, params) => ({
  type: ActionTypes.WB_SHOW_DIALOG,
  payload: { dialog, params: params || [] },
});
/* hideDialog */
export const hideDialog = (dialog) => ({
  type: ActionTypes.WB_HIDE_DIALOG,
    payload: { dialog },
});
/* showNewFileDialog */
export const showNewFileDialog = () => ({
  type: ActionTypes.WB_SHOW_NEW_FILE_DIALOG,
    payload: null,
});
/* startRecorder */
export const startRecorder = () => ({
  type: ActionTypes.WB_START_RECORDER,
    payload: { },
});
/* stopRecorder */
export const stopRecorder = () => ({
  type: ActionTypes.WB_STOP_RECORDER,
    payload: { },
});
/* onTabChange */
export const onTabChange = (key) => {
  return {
    type: ActionTypes.WB_ON_TAB_CHANGE,
    payload: { key },
  };
};
/* onContentUpdate */
export const onContentUpdate = (path, content) => ({
  type: ActionTypes.WB_ON_CONTENT_UPDATE,
  payload: { path, content },
})

/* showContextMenu */
export const showContextMenu = (type, event = null) => ({
  type: ActionTypes.WB_SHOW_CONTEXT_MENU,
  payload: { type, event },
})
