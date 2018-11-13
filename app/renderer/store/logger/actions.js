/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';

export const setActiveLogger = (logger) => ({
  type: ActionTypes.LOGGER_SET_ACTIVE,
  payload: { logger },
});

export const addLog = (message, severity = 'INFO', logger = 'general', timestamp = null, extra = null) => ({
  type: ActionTypes.LOGGER_ADD_LOG,
  payload: {
    message,
    severity,
    logger,
    timestamp: timestamp || (new Date()).getTime(),
    extra,
  },
});

export const resetGeneralLogs = () => ({
  type: ActionTypes.LOGGER_RESET_GENERAL,
  payload: null,
});
