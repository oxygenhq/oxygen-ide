/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { remote } from 'electron';
import * as types from './types';

const defaultAppSettings = {
  lastSession: {
    tabs: [],
    rootFolder: null,
  },
  recentFiles: null,
};

const defaultState = {
  navbar: {
    visible: false,
  },
  logger: {
    visible: true,
  },
  sidebars: {
    left: {
      visible: true,
      size: 250,
    },
    right: {
      visible: false,
      size: 250,
    },
    ...defaultAppSettings,
  },
};

export default (state = defaultState, action) => {
  const payload = action.payload || {};
  const { value, target, settings } = payload;
  switch (action.type) {
    // SETTINGS_MERGE
    case types.SETTINGS_MERGE:
      return {
        ...state,
        ...settings,
      };
    // LAST_SESSION_SET_ROOT_FOLDER
    case types.LAST_SESSION_SET_ROOT_FOLDER:
      return {
        ...state,
        lastSession: {
          ...state.lastSession,
          rootFolder: value,
        },
      };
    // SIDEBAR_SET_VISIBLE
    case types.SIDEBAR_SET_VISIBLE:
      if (typeof value === 'undefined' || typeof target === 'undefined') {
        return state;
      }
      return {
        ...state,
        sidebars: {
          ...state.sidebars,
          [target]: {
            ...state.sidebars[target],
            visible: value,
          }
        },
      };
    // SIDEBAR_SET_SIZE
    case types.SIDEBAR_SET_SIZE:
      if (typeof value === 'undefined' || typeof target === 'undefined') {
        return state;
      }
      return {
        ...state,
        sidebars: {
          ...state.sidebars,
          [target]: {
            ...state.sidebars[target],
            size: value,
          }
        },
      };
      // LOGGER_SET_VISIBLE
      case types.LOGGER_SET_VISIBLE:
      if (typeof value === 'undefined') {
        return state;
      }
      return {
        ...state,
        logger: {
          ...state.logger,
          visible: value,
        },
      };
    default:
      return state;
  }
};
