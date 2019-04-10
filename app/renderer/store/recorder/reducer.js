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
  isRecording: false,
  isChromeExtensionEnabled: false,
  activeFile: null,
  steps: [],
};

export default (state = defaultState, action) => {
  const payload = action.payload || {};
  const { path, step, value } = payload;

  switch (action.type) {
    case ActionTypes.RECORDER_SET_TIMESTAMP : {
      return {
        ...state,
        isChromeExtensionEnabled: value
      };
    }

    // RECORDER_START
    case success(ActionTypes.RECORDER_START):
      return {
        ...state,
        isRecording: true,
        activeFile: path,
      };

    // RECORDER_STOP
    case ActionTypes.RECORDER_STOP:
      return {
        ...state,
        isRecording: false,
      };

    // RECORDER_SET_ACTIVE_FILE
    case ActionTypes.RECORDER_SET_ACTIVE_FILE:
      return {
        ...state,
        //$FlowFixMe
        activeFile: value,
      };

    // RECORDER_ADD_STEP
    case ActionTypes.RECORDER_ADD_STEP:
      return {
        ...state,
        steps: [
          ...state.steps,
          step,
        ],
      };

    default:
      return state;
  }
};
