/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { ipcRenderer } from 'electron';
// import uniqid from 'uniqid';
import * as types from './types';

const defaultState = {
  nodes: [],
  refreshScroll: false,
  baseRoot: '',
  currentFile: {
    path: false,
  },
  activeFiles: [], // tabs
};

export default (state = defaultState, action) => {
  let { activeFiles } = state;
  const { currentFile, refreshScroll } = state;

  switch (action.type) {
    case types.BASE_ROOT_PATH:
      return { ...state, baseRoot: action.payload };

    case types.CLEAR_TABS_BUNDLE:
      ipcRenderer.send('latestSelectedFile', null);
      ipcRenderer.send('latestOpenedTabs', null);
      return {
        ...state,
        activeFiles: [],
        currentFile: {
          path: false,
        },
      };

    case types.UPDATE_FILE_DATA:
      const file = action.payload;
      const af = [...activeFiles];
      const index = af.findIndex((item) => item.path === file.path);
      af[index] = file;

      const data = {
        ...state,
        activeFiles: af,
      };

      if (currentFile.path === file.path) {
        data.currentFile = {
          ...file,
          meta: {
            touched: file.meta.touched,
            content: file.meta.content,
          }
        };
      }

      return data;

    case types.SET_NEW_TABS_ORDER:
      return {
        ...state,
        activeFiles: action.payload,
      };

    case types.SET_TABS:
      return {
        ...state,
        activeFiles: action.payload,
      };

    case types.TREE_NODES_BUNDLE:
      return {
        ...state,
        nodes: action.payload,
      };

    case types.SET_CURRENT_FILE:
      ipcRenderer.send('latestSelectedFile', action.payload);
      ipcRenderer.send('latestOpenedTabs', activeFiles);

      return {
        ...state,
        currentFile: action.payload,
      };

    case types.EXCLUDE_NODE_FROM_TABS:
      // set first file from stack active if removed file also is active
      const newStack = state.activeFiles
        .filter((item) => item.path !== action.payload.path);

      if (state.currentFile.path !== false && state.currentFile.path === action.payload.path) {
        ipcRenderer.send('latestOpenedTabs', newStack);
        if (newStack.length === 0) {
          ipcRenderer.send('latestSelectedFile', null);
        }
        return {
          ...state,
          currentFile: newStack.length ? newStack[0] : {
            path: false,
          },
          activeFiles: newStack,
        };
      }

      ipcRenderer.send('latestOpenedTabs', newStack);

      const newState = {
        ...state,
        activeFiles: newStack,
      };

      if (newStack.length === 0) {
        ipcRenderer.send('latestSelectedFile', null);
        newState.currentFile = {
          path: false,
        };
      }

      return newState;

    case types.ADD_NODE_TO_TABS:
      // Add file to stack if not exists
      if (!state.activeFiles.find((item) => item.path === action.payload.path)) {
        activeFiles = [
          ...state.activeFiles,
          {
            ...action.payload,
            order: state.activeFiles.length + 1
          },
        ];
      }

      return {
        ...state,
        currentFile: action.payload,
        activeFiles,
      };

    case types.REMOVE_UNTITLED:

      return {
        ...state,
        activeFiles: [...activeFiles.filter((item) => !item.path.includes('unknown'))],
      };

    case types.CREATE_NEW_FILE:
      const idenity = activeFiles.filter((item) => item.path.includes('unknown'));
      const prepareNewFile = {
        extension: '',
        name: `Untitled-${idenity.length}`,
        type: 'file',
        path: `unknown-${idenity.length}`,
        meta: {
          touched: true,
          content: '',
        }
      };

      return {
        ...state,
        currentFile: prepareNewFile,
        activeFiles: [
          ...activeFiles,
          prepareNewFile
        ],
      };

    case types.REFRESH_SCROLL:
      return {
        ...state,
        refreshScroll: !refreshScroll,
      };

    default:
      return state;
  }
};
