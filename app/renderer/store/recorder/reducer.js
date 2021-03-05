/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
import { success } from '../../helpers/redux';

const defaultState = {
    canRecordChrome: false,
    canRecordFirefox: false,
    isRecordingChrome: false,
    isChromeExtensionEnabled: false,
    waitChromeExtension: true,
    waitFirefoxExtension: true,
    activeFile: null,
    activeFileName: null,
    steps: []
};

export default (state = defaultState, action) => {
    const payload = action.payload || {};
    const {
        path,
        step,
        steps,
        value,
        cache,
        name,
        browserName
    } = payload;

    switch (action.type) {
    case ActionTypes.RECORDER_STOP_WAIT_CHROME_EXTENSION : {
        return {
            ...state,
            waitChromeExtension: false
        };
    }
    case ActionTypes.RECORDER_STOP_WAIT_FIREFOX_EXTENSION : {
        return {
            ...state,
            waitFirefoxExtension: false
        };
    }

    case ActionTypes.RECORDER_CHROME_CHANGE_CAN_RECORD : {
        return {
            ...state,
            canRecordChrome: value
        };
    }

    case ActionTypes.RECORDER_FIREFOX_CHANGE_CAN_RECORD: {
        return {
            ...state,
            canRecordFirefox: value
        };
    }

    case ActionTypes.RECORDER_SET_TIMESTAMP : {
        return {
            ...state,
            isChromeExtensionEnabled: value
        };
    }

    // RECORDER_START
    case success(ActionTypes.RECORDER_START): {

        let isRecordingName = 'Chrome';
        if (browserName && browserName === 'firefox') {
            isRecordingName = 'Firefox';
        }

        return {
            ...state,
            ['isRecording' + isRecordingName]: true,
            ['activeFile' + isRecordingName]: path,
            ['activeFileName' + isRecordingName]: name,
        };
    }

    // RECORDER_STOP
    case ActionTypes.RECORDER_STOP: {
        let isRecordingName = 'Chrome';
        if (browserName && browserName === 'firefox') {
            isRecordingName = 'Firefox';
        }
        return {
            ...state,
            ['isRecording' + isRecordingName]: false,
        };
    }

    // RECORDER_SET_ACTIVE_FILE
    case ActionTypes.RECORDER_REPLACE_FILE_CREDENTIALS:
        return {
            ...state,
            //$FlowFixMe
            activeFile: path,
            activeFileName: name
        };

    // RECORDER_SET_ACTIVE_FILE
    case ActionTypes.RECORDER_SET_ACTIVE_FILE:
        return {
            ...state,
            //$FlowFixMe
            activeFile: value,
            activeFileName: null
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

    // RECORDER_ADD_STEP
    case ActionTypes.RECORDER_ADD_STEPS:
        return {
            ...state,
            steps: [
                ...state.steps,
                ...steps,
            ],
        };

    case 'FROM_CACHE': 
        return {
            ...defaultState,
            ...cache.recorder
        };

    case 'RESET': {
        return defaultState;
    }

    default:
        return state;
    }
};
