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

const defaultState = {
    path: null,
    name: null,
    tree: null,
    active: null,
    start: null,
    end: null,
    repoRoot: null,
    parent: null
};

export default (state = defaultState, action) => {
    const payload = action.payload || {};
    const { tree, path, name, start, end, repoRoot, parent } = payload;

    switch (action.type) {

    // SET_PARENT
    case ActionTypes.OR_SET_PARENT: 
        return {
            ...state,
            parent: parent
        };

    // OPEN_FILE_SUCCESS
    case success(ActionTypes.OR_OPEN_FILE):
        return {
            ...state,
            tree: tree,
            path: path,
            name: name,
            start: start,
            end: end,
            repoRoot: repoRoot
        };
    
    // OPEN_FILE_FAILURE
    case failure(ActionTypes.OR_OPEN_FILE):

        console.log('payload', payload);

        return {
            ...state,
        };

    // OPEN_FILE_SUCCESS
    case ActionTypes.OR_SET_ACTIVE:
        return {
            ...state,
            active: path,
        };

    // OR_CLOSE_ACTIVE
    case ActionTypes.OR_CLOSE_ACTIVE:
        return {
            ...state,
            active: null,
        };
    

    // OR_CLEAR
    case ActionTypes.OR_CLEAR: {
        return defaultState;
    }

    default:
        return state;
    }
};
