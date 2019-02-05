/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/* eslint-disable */
import * as TYPES from './types';
import dispatchAsync from '../../helpers/dispatchAsync';
import { success, failure } from '../../helpers/redux';

/* set tree rootPath */
export const setTreeRootPath = (path) => {
  return {
    type: TYPES.FS_SET_TREE_ROOT_PATH,
    payload: { path },
  };
}

/* Add file or folder */
export const addFileOrFolder = (fileOrFolder) => {
  return {
    type: TYPES.FS_ADD_FILE_OR_FOLDER,
    payload: { fileOrFolder },
  };
}

/* fetchFolderContent */
export const fetchFolderContent = (path) => {
  return {
      type: TYPES.FS_FETCH_FOLDER_CONTENT,
      payload: { path },
  };
}
export const _fetchFolderContent_Success = (path, content) => {
  return {
      type: succcess(TYPES.FS_FETCH_FOLDER_CONTENT),
      payload: { path, response: content },
  };
}
export const _fetchFolderContent_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_FETCH_FOLDER_CONTENT),
      payload: { path, error },
  };
}

/* fetchFileContent */
export const fetchFileContent = (path) => {
  return {
      type: TYPES.FS_FETCH_FILE_CONTENT,
      payload: { path },
  };
}
export const _fetchFileContent_Success = (path, content) => {
  return {
      type: success(TYPES.FS_FETCH_FILE_CONTENT),
      payload: { path, response: content },
  };
}
export const _fetchFileContent_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_FETCH_FILE_CONTENT),
      payload: { path, error },
  };
}

/* fetchFileInfo */
export const fetchFileInfo = (path) => {
  return {
      type: TYPES.FS_FETCH_FILE_INFO,
      payload: { path },
  };
}
export const _fetchFileInfo_Success = (path, info) => {
  return {
      type: success(TYPES.FS_FETCH_FILE_INFO),
      payload: { path, response: info },
  };
}
export const _fetchFileInfo_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_FETCH_FILE_INFO),
      payload: { path, error },
  };
}

/* treeOpenFolder */
export const treeOpenFolder = (path) => {
  return {
      type: TYPES.FS_TREE_OPEN_FOLDER,
      payload: { path },
  };
}
export const _treeOpenFolder_Success = (path, folder) => {
  return {
      type: success(TYPES.FS_TREE_OPEN_FOLDER),
      payload: { path, response: folder },
  };
}
export const _treeOpenFolder_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_TREE_OPEN_FOLDER),
      payload: { path, error },
  };
}

/* saveFile */
export const saveFile = (path, saveAsPath = null) => {
  return {
      type: TYPES.FS_SAVE_FILE,
      payload: { path, saveAsPath },
  };
}
export const _saveFile_Success = (path, folder) => {
  return {
      type: success(TYPES.FS_SAVE_FILE),
      payload: { path, response: folder },
  };
}
export const _saveFile_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_SAVE_FILE),
      payload: { path, error },
  };
}

/* saveFileAs */
export const saveFileAs = (path, content) => {
  return {
      type: TYPES.FS_SAVE_FILE_AS,
      payload: { path, content },
  };
}
export const _saveFileAs_Success = (path, content, fileInfo) => {
  return {
      type: success(TYPES.FS_SAVE_FILE_AS),
      payload: { path, content, response: fileInfo },
  };
}
export const _saveFileAs_Failure = (path, error) => {
  return {
      type: failure(TYPES.FS_SAVE_FILE_AS),
      payload: { path, error },
  };
}

/* treeLoadNodeChildren */
export const treeLoadNodeChildren = (nodePath, force = false) => {
  // node can be either an object or a string. If string is provided, than use it as a key to find the node (path).
  if (typeof nodePath === 'string') {
    return {
      type: TYPES.FS_TREE_LOAD_NODE_CHILDREN,
      payload: { path: nodePath, force },
    };  
  }
  return {
    type: TYPES.FS_TREE_LOAD_NODE_CHILDREN,
    payload: { node: nodePath, force },
  };
};

export const treeLoadNodeChildrenSuccess = (path, children) => {
  return {
    type: success(TYPES.FS_TREE_LOAD_NODE_CHILDREN),
    payload: { path, response: children },
  };
};

export const treeLoadNodeChildrenFailure = (path, error) => {
  return {
    type: failure(TYPES.FS_TREE_LOAD_NODE_CHILDREN),
    payload: { path, response: { error } },
  };
};

/* rename */
export const rename = (path, newName) => ({
  type: TYPES.FS_RENAME,
  payload: { path, newName },
});
export const _rename_Success = (oldPath, newFile) => ({
  type: success(TYPES.FS_RENAME),
  payload: { oldPath, newFile },
});
export const _rename_Failure = (path, error) => ({
  type: failure(TYPES.FS_RENAME),
  payload: { path, error },
});

/* delete */
export const deleteFile = (path) => ({
  type: TYPES.FS_DELETE,
  payload: { path },
});
export const _delete_Success = (path) => ({
  type: success(TYPES.FS_DELETE),
  payload: { path },
});
export const _delete_Failure = (path, error) => ({
  type: failure(TYPES.FS_DELETE),
  payload: { path, error },
});

/* createFolder */
export const createFolder = (path, name) => ({
  type: TYPES.FS_CREATE_FOLDER,
  payload: { path, name },
});
export const _createFolder_Success = (path, name, response) => ({
  type: success(TYPES.FS_CREATE_FOLDER),
  payload: { path, name, response },
});
export const _createFolder_Failure = (path, name, error) => ({
  type: failure(TYPES.FS_CREATE_FOLDER),
  payload: { path, name, error },
});

/* createFile */
export const createFile = (path, name) => ({
  type: TYPES.FS_CREATE_FILE,
  payload: { path, name },
});
export const _createFile_Success = (path, name, response) => ({
  type: success(TYPES.FS_CREATE_FILE),
  payload: { path, name, response },
});
export const _createFile_Failure = (path, name, error) => ({
  type: failure(TYPES.FS_CREATE_FILE),
  payload: { path, name, error },
});

/* openFolder */
export const openFolder = (path) => dispatch => dispatchAsync(
  mainIpc.call("FileService", "getFoldersAndFiles", [ path ]),
  dispatch,
  TYPES.FS_OPEN_FOLDER,
  { path: path }
);

/* setActiveNode */
export const setActiveNode = (path) => {
  return {
      type: TYPES.FS_TREE_SET_ACTIVE_NODE,
      payload: { path },
  };
}

/* updateFileContent */
export const updateFileContent = (path, content) => ({
  type: TYPES.FS_UPDATE_FILE_CONTENT,
  payload: { path, content },
});

/* resetFileContent */
export const resetFileContent = (path) => ({
  type: TYPES.FS_RESET_FILE_CONTENT,
  payload: { path },
});

/* clearAllFiles */
export const clearAllFiles = () => ({
  type: TYPES.FS_CLEAR_ALL_FILES,
  payload: null,
});

/* clearTree */
export const clearTree = () => ({
  type: TYPES.FS_TREE_CLEAR,
  payload: null,
});
