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
    [types.DIALOG_OBJECT_ELEMENT_CREATE]: {
        visible: false,
    },
    [types.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME]: {
        visible: false,
    },
    [types.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE]: {
        visible: false,
    },
    [types.DIALOG_OBJECT_CONTAINER_CREATE]: {
        visible: false,
    },
    [types.DIALOG_INCORECT_CHROME_DRIVER_VERSION]: {
        visible: false
    },
    [types.DIALOG_DOWNLOADING_CHROME_DRIVER]: {
        visible: false
    },
    [types.DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS]: {
        visible: false
    },
    [types.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED]: {
        visible: false
    },
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
