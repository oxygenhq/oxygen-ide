/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
// import { success, failure } from '../../../renderer/helpers/redux';

// stepStart 
export const stepStart = (rid, step) => ({
    type: ActionTypes.DBG_STEP_START,
    payload: { rid, step }
});

// stepEnd
export const stepEnd = (rid, stepId, result) => ({
    type: ActionTypes.DBG_STEP_END,
    payload: { rid, stepId, result },
});

// add event
export const addEvent = (event) => ({
    type: ActionTypes.DBG_ADD_EVENT,
    payload: {
        event
    }
});

export const changeMode = (mode) =>  ({
    type: ActionTypes.DBG_CHANGE_MODE,
    payload: {
        mode
    }
});
