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

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 36;

const defaultAppSettings = {
  lastSession: {
    tabs: [],
    rootFolder: null,
  },
  recentFiles: null,
};

const defaultState = {
  showLanding: false,
  fontSize: 12,
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
  const { value, target, settings, zoom } = payload;
  switch (action.type) {
    
    // SHOW LANDING
    case types.SHOW_LANDING: {
      return { 
        ...state,
        showLanding: true,
        ...defaultAppSettings
      }
    }
    
    // HIDE LANDING
    case types.HIDE_LANDING: {
      return { 
        ...state,
        showLanding: false
      }
    }

    // ZOOM_IN
    case types.EDITOR_ZOOM_IN: {
      const newFontSize = state.fontSize+2;
      if(newFontSize > FONT_SIZE_MAX){
        return state;
      } else {
        return { 
          ...state,
          fontSize: newFontSize
        }
      }
    }

    // ZOOM_OUT
    case types.EDITOR_ZOOM_OUT: {
      const newFontSize = state.fontSize-2;
      if(newFontSize < FONT_SIZE_MIN){
        return state;
      } else {
        return { 
          ...state,
          fontSize: newFontSize
        }
      }
    }

    // ZOOM_TO_DEFAULT
    case types.EDITOR_ZOOM_TO_DEFAULT: {
      return { 
        ...state,
        fontSize: defaultState.fontSize
      }
    }

    // SET_ZOOM
    case types.EDITOR_SET_ZOOM: {
      if(zoom){
        return { 
          ...state,
          fontSize: zoom
        }
      } else {
        return state;
      }
    }

    // SETTINGS_MERGE
    case types.SETTINGS_MERGE:
      return {
        ...state,
        ...settings
      };
    // LAST_SESSION_SET_ROOT_FOLDER
    case types.LAST_SESSION_SET_ROOT_FOLDER:
      return {
        ...state,
        showLanding: false,
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
