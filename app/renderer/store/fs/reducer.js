/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/* eslint-disable */
// import uniqid from 'uniqid';
import { message } from 'antd';
import * as ActionTypes from './types';
import subjects from './subjects';
import * as treeHelpers from '../../helpers/tree';
import * as fsHelpers from '../../helpers/fs';
import { success, failure } from '../../helpers/redux';
import fileFolderSorter from '../../../main/helpers/fileFolderSorter';

const defaultState = {
  isLoading: false,
  files: {},
  tree: {
    data: null,
    activeNode: null,
  },
  rootPath: null,
  refreshScroll: false,
};

export default (state = defaultState, action, dispatch) => {
  const payload = action.payload || {};
  const { path, node, name, response, content, error, fileOrFolder, cache } = payload;
  let _newActiveNode, _filesClone, _node, _treeDataClone;

  switch (action.type) {
    case ActionTypes.FS_ADD_FILE_OR_FOLDER: {
      if(!fileOrFolder){
        return state;
      }
      return { 
        ...state, 
        tree: {
          data: treeHelpers.addTreeNode(state.tree.data, fileOrFolder, state.rootPath),
        }
      };
    }

    case ActionTypes.FS_SET_TREE_ROOT_PATH:
      if(path){
        return {
          ...state, 
          rootPath: path,
        }
      } else {
        return state;
      }

    // FS_TREE_OPEN_FOLDER
    case ActionTypes.FS_TREE_OPEN_FOLDER:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_TREE_OPEN_FOLDER):
      return { 
        ...state, 
        rootPath: path,
        tree: {
          ...state.tree,
          activeNode: null,
          data: treeHelpers.wrap(response),
        },
        isLoading: false,
      };
    case failure(ActionTypes.FS_TREE_OPEN_FOLDER):
      return { 
        ...state, 
        rootPath: null,
        tree: defaultState.tree,
        isLoading: false,
      };

    // FS_RENAME
    case ActionTypes.FS_RENAME:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_RENAME):
      const { oldPath, newFile } = payload;
      return { 
        ...state, 
        tree: {
          activeNode: fsHelpers.replacePath(state.tree.activeNode, oldPath, newFile.path),
          data: treeHelpers.updateTree(state.tree.data, newFile, oldPath),
        },
        files: fsHelpers.updateFilesAfterRename(state.files, oldPath, newFile),
        isLoading: false,
      };

    case failure(ActionTypes.FS_RENAME):
      message.error(`Error renaming '${path}': ${error.code}`);
      return { 
        ...state, 
        isLoading: false,
      };

    // FS_DELETE
    case ActionTypes.FS_DELETE:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_DELETE):
      if(!path){
        return state;
      }
      _newActiveNode = state.tree.activeNode === path ? null : state.tree.activeNode;
      let filesClons = {};
      // clone all files except the one we just renamed
      for (var filePath of Object.keys(state.files)) {
        if (path !== filePath) {
          filesClons[filePath] = state.files[filePath];
        }
      }
      return { 
        ...state, 
        tree: {
          activeNode: _newActiveNode,
          data: treeHelpers.clearEmptyChildArray(treeHelpers.checkEmpty(treeHelpers.removeTreeNode(state.tree.data, path)))
        },
        files: filesClons,
        isLoading: false,
      };
    case failure(ActionTypes.FS_DELETE):
      message.error(`Error deleting '${path}': ${error.code}`);
      return { 
        ...state, 
        isLoading: false,
      };

    // FS_CREATE_FOLDER
    case ActionTypes.FS_CREATE_FOLDER:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_CREATE_FOLDER):
      return { 
        ...state, 
        isLoading: false,
      };
    case failure(ActionTypes.FS_CREATE_FOLDER):
      message.error(`Error creating folder '${name}' in '${path}': ${error.code}`);
      return { 
        ...state, 
        isLoading: false,
      };

    // FS_CREATE_FOLDER
    case ActionTypes.FS_CREATE_FILE:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_CREATE_FILE):
      return { 
        ...state, 
        isLoading: false,
      };
    case failure(ActionTypes.FS_CREATE_FILE):
      message.error(`Error creating file '${name}' in '${path}': ${error.code}`);
      return { 
        ...state, 
        isLoading: false,
      };

    // FS_TREE_LOAD_NODE_CHILDREN
    case ActionTypes.FS_TREE_LOAD_NODE_CHILDREN:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_TREE_LOAD_NODE_CHILDREN):
      // if root path needs to be refreshed, then call margeChildren on state.tree.data rather on a particular node (as there is no root node in the tree)
      if (response && fsHelpers.normalize(path) === fsHelpers.normalize(state.rootPath)) {
        _treeDataClone = treeHelpers.mergeChildren(state.tree.data, treeHelpers.wrap(response));
      }
      else if (response) {
        _node = treeHelpers.findTreeNode(state.tree.data, path);
        if (_node) {
          // update node's children and expanded state
          _node.children = treeHelpers.mergeChildren(_node.children, treeHelpers.wrap(response));
          _node.isExpanded = true;
          // generate rxjs event
          subjects["FILE.CHILDREN.LOADED"].next({ path: _node.path, children: response });
          _treeDataClone = treeHelpers.updateTree(state.tree.data, _node);
        }
      }

      return { 
        ...state, 
        tree: {
          ...state.tree,
          data: _treeDataClone ? _treeDataClone : state.tree.data,
        },
        isLoading: false,
      };
    case failure(ActionTypes.FS_TREE_LOAD_NODE_CHILDREN):
      let errMsg = 'Unknown load node children error';
      let nodePath = 'Unknown nodePath';

      if(error){
        errMsg = error.code ? error.code : (error.message ? error.message : error);
      }

      if(node && node.path){
        nodePath = node.path;
      }

      // generate rxjs event
      subjects["FILE.CHILDREN.LOADED"].next({ path: nodePath, error: errMsg });

      if(name && nodePath && errMsg){
        // display error to the user
        message.error(`Error creating folder '${name}' in '${nodePath}': ${errMsg}`);
      }

      return { 
        ...state, 
        isLoading: false,
      };

    // FS_TREE_SET_ACTIVE_NODE
    case ActionTypes.FS_TREE_SET_ACTIVE_NODE:
      return { 
        ...state, 
        tree: {
          ...state.tree,
          activeNode: path,
        },
        isLoading: true,
      };

    // FETCH_FOLDER_CONTENT
    case ActionTypes.FS_FETCH_FOLDER_CONTENT:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_FETCH_FOLDER_CONTENT):
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: response
        }
      }

    // FETCH_FILE_CONTENT
    case ActionTypes.FS_FETCH_FILE_CONTENT:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_FETCH_FILE_CONTENT): 
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            content: response,
          }
        }
      }
    
    // FETCH_FILE_INFO
    case ActionTypes.FS_FETCH_FILE_INFO:
      return { 
        ...state, 
        isLoading: true,
      };
    case success(ActionTypes.FS_FETCH_FILE_INFO):
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: response
        }
      };
    
    // UPDATE_FILE_CONTENT
    case ActionTypes.FS_UPDATE_FILE_CONTENT:
      if (!state.files.hasOwnProperty(path)) {
        return state;
      }
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            modified: true,
            content: content,
          },
        },
      };

    // RESET_FILE_CONTENT
    case ActionTypes.FS_RESET_FILE_CONTENT:
      if (!state.files.hasOwnProperty(path)) {
        return state;
      }      
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            modified: false,
            content: null,
          },
        },
      };

    // CLEAR_ALL_FILES
    case ActionTypes.FS_CLEAR_ALL_FILES:
      return {
        ...state,
        files: {},  // reset files cache
      };

    // TREE_CLEAR
    case ActionTypes.FS_TREE_CLEAR:
    return {
      ...state,
      tree: {     // reset File Explorer tree
        data: null,
        activeNode: null,
      },
    };

    // SAVE_FILE_SUCCESS
    case success(ActionTypes.FS_SAVE_FILE):
    // SAVE_FILE__AS_SUCCESS
    case success(ActionTypes.FS_SAVE_FILE_AS):
      if (!path || !state.files.hasOwnProperty(path)) {
        return state;
      }      
      return {
        ...state,
        isLoading: false,
        files: {
          ...state.files,
          [path]: {
            ...state.files[path],
            modified: false,
          },
        },
      };

    case 'FROM_CACHE': 
      return {
        ...defaultState,
        ...cache.fs
      }

    case 'RESET': {
      return defaultState;
    }
  
    default:
      return state;
  }
};
