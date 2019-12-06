/* eslint-disable no-prototype-builtins */
/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';

const defaultState = {
    logs: {
        general: [],
        selenium: [],
        appium: [],
    },
    active: 'general',
};

export default (state = defaultState, action) => {
    const payload = action.payload || {};
    const { message, severity, logger, timestamp, extra, cache } = payload;

    switch (action.type) {
    // LOGGER_ADD_LOG
    case ActionTypes.LOGGER_ADD_LOG:
        const newState = {
            ...state,
            logs: cloneLogs(state.logs),
        };
        if (!state.logs.hasOwnProperty(logger)) {
            newState.logs[logger] = {};
        }
        const logs = newState.logs[logger];
        logs.push({
            timestamp,
            severity,
            message: (message ? message.trim() : null),
            extra,
        });
        return newState;

    // LOG_SET_ACTIVE
    case ActionTypes.LOGGER_SET_ACTIVE:
        return {
            ...state,
            //$FlowFixMe
            active: logger,
        };

    // RESET_GENERAL_LOGS
    case ActionTypes.LOGGER_RESET_GENERAL:
        return {
            active: state.active,
            logs: {
                ...state.logs,
                ['general']: [],
            },
        };

    case 'FROM_CACHE': 
        return {
            ...defaultState,
            ...cache.logger
        };

    case 'RESET': {
        return defaultState;
    }

    default:
        return state;
    }
};

function cloneLogs(logs) {
    let clone = {};
    for (var key of Object.keys(logs)) {
        clone[key] = [
            ...logs[key]
        ];
    }
    return clone;
}
