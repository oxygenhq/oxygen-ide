/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

const defaultState = {
  [types.DIALOG_FILE_CREATE]: {
    visible: false,
  },
  [types.DIALOG_FILE_RENAME]: {
    visible: false,
  },
  [types.DIALOG_FILE_SAVE]: {
    visible: false,
  },
  [types.DIALOG_UPDATE]: {
    visible: false,
  },
  [types.DIALOG_SETTINGS]: {
    visible: false,
  },
  [types.DIALOG_NEED_ISTALL_EXTENSION]: {
    visible: false,
  },
  [types.DIALOG_OBJECT_CREATE]: {
    visible: false,
  },
  [types.DIALOG_OBJECT_FOLDER_CREATE]: {
    visible: false,
  }
};

export default (state = defaultState, action) => {
  const { payload } = action;
  const { dialog, cache } = payload || {};

  if(action.type === 'RESET'){
    return defaultState;
  }

  if(action.type === 'FROM_CACHE'){
    return {
      ...defaultState,
      ...cache.dialog
    };
  }
  
  
  if (!dialog || !state.hasOwnProperty(dialog)) {
    return state;
  }
  return { 
    ...state, 
    [dialog]: { 
      ...state[dialog],
      ...payload 
    },
  };
};
