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

export const changeChromeCanRecord = (newCanRecord) => ({
    type: ActionTypes.RECORDER_CHROME_CHANGE_CAN_RECORD,
    payload: { value: newCanRecord },
});

export const changeFirefoxCanRecord = (newCanRecord) => ({
    type: ActionTypes.RECORDER_FIREFOX_CHANGE_CAN_RECORD,
    payload: { value: newCanRecord },
});


// stop wait chrome extension
export const stopWaitChromeExtension = () => ({
    type: ActionTypes.RECORDER_STOP_WAIT_CHROME_EXTENSION,
    payload: null,
});

// stop wait chrome extension
export const stopWaitFireFirefoxExtension = () => ({
    type: ActionTypes.RECORDER_STOP_WAIT_FIREFOX_EXTENSION,
    payload: null,
});

// startRecorder
export const startRecorder = (browserName) => ({
    type: ActionTypes.RECORDER_START,
    payload: {
        browserName: browserName
    },
});

export const _startRecorder_Success = (path, name = null, browserName) => ({
    type: success(ActionTypes.RECORDER_START),
    payload: { path, name, browserName },
});

export const _startRecorder_Failure = (path, error, browserName) => ({
    type: failure(ActionTypes.RECORDER_START),
    payload: { path, error, browserName },
});

// stopRecorder
export const stopRecorder = () => ({
    type: ActionTypes.RECORDER_STOP,
    payload: { },
});

// setActiveFile
export const setActiveFile = (path) => ({
    type: ActionTypes.RECORDER_SET_ACTIVE_FILE,
    payload: { path },
});


// setActiveFile
export const replaceFileCredentials = (path, name) => ({
    type: ActionTypes.RECORDER_REPLACE_FILE_CREDENTIALS,
    payload: { path, name },
});


// addStep
export const addStep = (step) => ({
    type: ActionTypes.RECORDER_ADD_STEP,
    payload: { step },
});

export const addSteps = (steps) => ({
    type: ActionTypes.RECORDER_ADD_STEPS,
    payload: { steps },
});

export const startRecorderWatcher = () => ({
    type: ActionTypes.RECORDER_START_WATCHER
});

export const setLastExtentionEnabledTimestamp = (timestamp) => ({
    type: ActionTypes.RECORDER_SET_TIMESTAMP,
    payload: { value: timestamp }
});