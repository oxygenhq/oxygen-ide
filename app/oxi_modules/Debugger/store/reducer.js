
/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
// import { success, failure } from '../../../renderer/helpers/redux';

const defaultState = {
    runners: {},
};

export default (state = defaultState, action) => {
    // const payload = action.payload || {};
    // const { rid, stepId, suiteId, caseId, case: caze, step, suite } = payload;

    switch (action.type) {

    // STEP_START
    case ActionTypes.DBG_STEP_START: 
        return {
            ...state,
        };

    // STEP_END
    case ActionTypes.DBG_STEP_END: 
        return {
            ...state,
        };

    default:
        return state;
    }
};