/* eslint-disable no-prototype-builtins */
/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { message } from 'antd';

import * as ActionTypes from './types';
import * as Const from '../../../const';
import { success, failure } from '../../helpers/redux';

const defaultState = {
    isRunning: false,         // indicates if a test is currently running
    isPaused: false,          // indicates if the current test is paused
    isSeleniumReady: false,   // indicates if built-in Selenium server has been successfully started
    isAppiumReady: false,     // indicates if built-in Appium server has been successfully started
    breakpoints: {},          // holds all user-defined breakpoints per file, shall include file name and line number
    disabledBreakpoints: {},
    resolvedBreakpoints: {},
    waitUpdateBreakpoints: false,
    mainFile: null,           // main test (script) file to be executed 
    runtimeSettings: {
        testMode: 'web',
        testTarget: 'chrome',
        testProvider: 'Local',
        stepDelay: 0,
        reopenSession: false,   // indicates if Selenium session must be re-opened for each iteration
        seleniumPort: null,     // holds Selenium server port number
        iterations: 1,
        paramFilePath: null,
        paramMode: 'sequential',
        seleniumPid: null
    },
    browsers: [
        {
            name: 'Chrome',
            id: 'chrome',
        },
        {
            name: 'Firefox',
            id: 'firefox',
        },
    ],
    devices: [],
    emulators: Const.CHROME_EMULATED_DEVICES,
    variables: null
};

if (process.platform === 'win32') {
    defaultState.browsers.push({
        name: 'Internet Explorer',
        id: 'ie',
    });
}

if (process.platform === 'darwin') {
    defaultState.browsers.push({
        name: 'Safari',
        id: 'safari',
    });
}

export default (state = defaultState, action) => {
    const payload = action.payload || {};
    const { value, settings, device, breakpoints, breakpoint, path, error, cache, fileName, variables, seleniumPid } = payload;
    let _newDevices = [];
    let _newBreakpoints = {};

    switch (action.type) {
    // TEST_START
    case ActionTypes.TEST_START:
        return {
            ...state,
            isRunning: true,
            isPaused: false,
            disabledBreakpoints: {},
            resolvedBreakpoints: {},
        };

    // TEST_START_FAILURE
    case failure(ActionTypes.TEST_START):
        if (error && error.type === ActionTypes.TEST_ERR_MAIN_SCRIPT_NOT_SAVED) {
            message.warning('The current file has been modified. Please save the file before running the test.');
        } else if (error && error.type === ActionTypes.TEST_ERR_MAIN_SCRIPT_NOT_SELECTED) {
            message.error('Please open a script file before you could run the test.');
        } else if (error && error.type === ActionTypes.TEST_ERR_MAIN_SCRIPT_IS_EMPTY) {
            message.error('Test with empty script file cannot be started.');
        }
        return {
            ...state,
            isRunning: false,
            isPaused: false,
        };

    // TEST_CONTINUE
    case ActionTypes.TEST_CONTINUE:
        return {
            ...state,
            isRunning: true,
            isPaused: false,
        };
    // TEST_EVENT_ENDED
    case ActionTypes.TEST_EVENT_ENDED:
        return {
            ...state,
            isRunning: false,
            isPaused: false,
            variables: null
        };
    // TEST_EVENT_BREAKPOINT
    case ActionTypes.TEST_EVENT_BREAKPOINT:
        return {
            ...state,
            isRunning: true,
            isPaused: true,
            variables: variables
        };
    // TEST_STOP
    case ActionTypes.TEST_STOP:
        return {
            ...state,
            stopingTest: true,
        };
    case success(ActionTypes.TEST_STOP):
        return {
            ...state,
            stopingTest: false,
            isRunning: false,
            isPaused: false,
            variables: null
    };
    case failure(ActionTypes.TEST_STOP):
        return {
            ...state,
            stopingTest: false,
            isRunning: false,
            isPaused: false,
            variables: null
        };
    // TEST_SET_MAIN
    case ActionTypes.TEST_SET_MAIN:
        return {
            ...state,
            mainFile: value,
        };
    // TEST_SET_TARGET
    case ActionTypes.TEST_SET_TARGET:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                testTarget: value,
            },
        };
    // TEST_SET_STEP_DELAY
    case ActionTypes.TEST_SET_STEP_DELAY:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                stepDelay: value,
            },
        };
    // TEST_SET_MODE
    case ActionTypes.TEST_SET_MODE:
        if (state.runtimeSettings.testMode === value) {
            return state;
        }

        // let newTestProvider = state.runtimeSettings.testProvider;

        // // determine new testTarget value, depending on the selected test mode
        let newTestTarget = null;
        if (value === 'web') {
            newTestTarget = state.browsers.length > 0 ? state.browsers[0].id : null;
        } else if (value === 'mob') {
            newTestTarget = state.devices.length > 0 ? state.devices[0].id : null;
        }
        else if (value === 'resp') {
            newTestTarget = state.emulators.length > 0 ? state.emulators[0] : null;
        }

        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                testMode: value,
                testTarget: newTestTarget,
            },
        };

    // TEST_SET_SELENIUM_READY
    case ActionTypes.TEST_SET_SELENIUM_READY:
        return {
            ...state,
            isSeleniumReady: value,
        };

    // TEST_SET_SELENIUM_PORT
    case ActionTypes.TEST_SET_SELENIUM_PORT:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                seleniumPort: value,
            },
        };

    // TEST_ADD_DEVICE
    case ActionTypes.TEST_ADD_DEVICE:
        if (!device || !device.id || state.devices.some(x => x.id === device.id)) {
            return state; // ignore any device which do not have UUID assigned or the device is already in the list
        }
        // if we are in Mobile mode, and no device is selected, then pre-select the new device
        const setTestTarget = state.runtimeSettings.testMode === 'mob' && !state.runtimeSettings.testTarget;
        return {
            ...state,
            devices: [
                ...state.devices,
                {
                    id: device.id,
                    name: device.name || device.info.name || device.id,
                    osName: device.info.os.name,
                    osVersion: device.info.os.version,
                },
            ],
            runtimeSettings: !setTestTarget ? state.runtimeSettings : {
                ...state.runtimeSettings,
                testTarget: device.id,
            },
        };

    // TEST_REMOVE_DEVICE
    case ActionTypes.TEST_REMOVE_DEVICE:
        _newDevices = [];
        for (var i = state.devices.length; i--;) {
            if (state.devices[i].id !== device.id){
                _newDevices.push(state.devices[i]);
            }
        }
        const updateTestTarget = state.runtimeSettings.testMode === 'mob' && state.runtimeSettings.testTarget === device.id;

        return {
            ...state,
            runtimeSettings: !updateTestTarget ? state.runtimeSettings : {
                ...state.runtimeSettings,
                testTarget: null,
            },
            devices: _newDevices,
        };

    // TEST_UPDATE_BREAKPOINTS
    case ActionTypes.TEST_UPDATE_BREAKPOINTS:
        if(path === 'unknown'){
            return {
                ...state,
                breakpoints: {
                    ...state.breakpoints,
                    [path+fileName]: breakpoints,
                },
            };
        } else {
            return {
                ...state,
                breakpoints: {
                    ...state.breakpoints,
                    [path]: breakpoints,
                },
            };
        }

    case ActionTypes.TEST_UPDATE_DISABLED_BREAKPOINTS:

            let previousDisabledBreakpoints = [];
            if(
                path &&
                state.disabledBreakpoints &&
                state.disabledBreakpoints[path] &&
                Array.isArray(state.disabledBreakpoints[path]) 
            ){
                previousDisabledBreakpoints = state.disabledBreakpoints[path];
            }

            return {
                ...state,
                disabledBreakpoints: {
                    ...state.disabledBreakpoints,
                    [path]: [...previousDisabledBreakpoints, breakpoint],
                },
            };

    case ActionTypes.TEST_UPDATE_RESOLVED_BREAKPOINT:
        let previousResolvedBreakpoints = [];
        if(
            path &&
            state.resolvedBreakpoints &&
            state.resolvedBreakpoints[path] &&
            Array.isArray(state.resolvedBreakpoints[path]) 
        ){
            previousResolvedBreakpoints = state.resolvedBreakpoints[path];
        }

        return {
            ...state,
            resolvedBreakpoints: {
                ...state.resolvedBreakpoints,
                [path]: [...previousResolvedBreakpoints, breakpoint],
            },
        };
        
    // TEST_UPDATE_BREAKPOINTS
    case ActionTypes.WAIT_TEST_UPDATE_BREAKPOINTS: {
        return {
            ...state,
            waitUpdateBreakpoints: value
        };
    }

    // TEST_MOVE_BREAKPOINTS_FROM_TMP_FILE_TO_REAL_FILE
    case ActionTypes.TEST_MOVE_BREAKPOINTS_FROM_TMP_FILE_TO_REAL_FILE:{
        const { tmpFilePath, tmpfileName, realFilePath } = payload;
        const newState = { ...state };

        if(
            tmpFilePath && 
        tmpfileName && 
        realFilePath &&
        newState.breakpoints[tmpFilePath+tmpfileName]
        ){
            newState.breakpoints[realFilePath] = newState.breakpoints[tmpFilePath+tmpfileName];
            delete newState.breakpoints[tmpFilePath+tmpfileName];
        }

        return newState;
    }

    // TEST_REMOVE_BREAKPOINTS
    case ActionTypes.TEST_REMOVE_BREAKPOINTS:
        // make sure the file with breakpoints is on the list
        if (!state.breakpoints || !state.breakpoints.hasOwnProperty(path)) {
            return state;
        }
        // clone all breakpoints except the one that needs to be removed (refered by path)
        _newBreakpoints = Object.keys(state.breakpoints).reduce((acc, cur) => cur === path ? acc : {...acc, [cur]: state.breakpoints[cur]}, {});
        return {
            ...state,
            breakpoints: _newBreakpoints,
        };

    // TEST_UPDATE_RUN_SETTINGS
    case ActionTypes.TEST_UPDATE_RUN_SETTINGS:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                ...settings
            },
        };

    // TEST_SET_PROVIDER
    case ActionTypes.TEST_SET_PROVIDER:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                testProvider: value,
                testTarget: null,
                testMode: null,
            },
        };
    case ActionTypes.TEST_SELENIUM_PID:
        return {
            ...state,
            runtimeSettings: {
                ...state.runtimeSettings,
                seleniumPid: seleniumPid,
            },
        };

    case 'FROM_CACHE': 
        return {
            ...defaultState,
            ...cache.test
        };

    case 'RESET': {
        return defaultState;
    }

    default:
        return state;
    }
};
