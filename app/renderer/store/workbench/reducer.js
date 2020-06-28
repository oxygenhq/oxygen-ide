/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { message } from 'antd';
import { success, failure } from '../../helpers/redux';
import * as ActionTypes from './types';

const defaultState = {
    isLoading: false,
    initialized: false
};

export default (state = defaultState, action, dispatch) => {
    const { error, cache } = action.payload || {};

    switch (action.type) {
    
    case success(ActionTypes.WB_INIT): {
        return {
            ...state,
            initialized: true
        };
    }

    case ActionTypes.WB_SET_JAVA_ERROR:
        return {
            ...state,
            javaError: error || true
        };
    case ActionTypes.WB_CLEAN_JAVA_ERROR: {
        let newState = { ...state };
        delete newState.javaError;
        return newState;
    }

    case ActionTypes.WB_SET_XCODE_ERROR:
        return {
            ...state,
            xCodeError: true
        };
    case ActionTypes.WB_CLEAN_XCODE_ERROR: {
        let newState = { ...state };
        delete newState.xCodeError;
        return newState;
    }

    // WB_OPEN_FILE
    case ActionTypes.WB_OPEN_FILE:
        return { 
            ...state, 
            isLoading: true,
        };

    // WB_OPEN_FILE_SUCCESS
    case success(ActionTypes.WB_OPEN_FILE): {
        if (error) {
            message.error(error.message);
        }
      
        return { 
            ...state, 
            isLoading: false,
        };
    }
    // WB_OPEN_FILE_FAILURE
    case failure(ActionTypes.WB_OPEN_FILE): {
        if (error) {
            message.error(error.message);
        }
      
        return { 
            ...state, 
            isLoading: false,
        };
    }

    // WB_START_RECORDER
    case ActionTypes.WB_START_RECORDER:
        return state;

    // WB_STOP_RECORDER
    case ActionTypes.WB_STOP_RECORDER:
        return state;

    case 'FROM_CACHE': 
        return {
            ...defaultState,
            ...cache.workbench
        };
      
    case 'RESET': {
        return defaultState;
    }

    default:
        return state;
    }
};
