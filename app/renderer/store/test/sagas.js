/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, take, call } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';

import { success, failure, successOrFailure } from '../../helpers/redux';
import * as testActions from './actions';
import * as editorActions from '../editor/actions';
import * as loggerActions from '../logger/actions';
import ActionTypes from '../types';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';
/**
 * Test Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.TEST_START, startTest),
      takeLatest(ActionTypes.TEST_STOP, stopTest),
      takeLatest(ActionTypes.TEST_CONTINUE, continueTest),
      takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
    ]);
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;
    if (!event) {
        return;
    }
    if (service === 'SeleniumService') {
        yield handleSeleniumServiceEvent(event);
    }
    else if (service === 'DeviceDiscoveryService') {
        yield handleDeviceDiscoveryServiceEvent(event);
    }
    else if (service === 'TestRunnerService') {
        yield handleTestRunnerServiceEvent(event);
    }    
}

function* handleTestRunnerServiceEvent(event) {
    if (event.type === 'LOG_ENTRY') {
        yield put(loggerActions.addLog(event.message, event.severity, 'general'));
    }
    else if (event.type === 'TEST_ENDED') {
        yield put(testActions.onTestEnded());
    }
    else if (event.type === 'LINE_UPDATE') {
        yield put(editorActions.setActiveLine(event.file, event.line));
    }
    else if (event.type === 'BREAKPOINT') {
        yield put(testActions.onBreakpoint(event.file, event.line));
    }
}

function* handleSeleniumServiceEvent(event) {
    if (event.type === 'SELENIUM_STARTED') {
        yield put(testActions.setSeleniumReady(true));
        const { port = null } = event;
        if (port) {
            yield put(testActions.setSeleniumPort(port));
        }        
    }
    else if (event.type === 'SELENIUM_STOPPED') {
        yield put(testActions.setSeleniumReady(false));
    }
    else if (event.type === 'LOG_ENTRY') {
        yield put(loggerActions.addLog(event.message, event.severity, 'selenium'));
    }
}

function* handleDeviceDiscoveryServiceEvent(event) {
    if (event.type === 'DEVICE_CONNECTED') {
        yield put(testActions.addDevice(event.device));
    }
    else if (event.type === 'DEVICE_DISCONNECTED') {
        yield put(testActions.removeDevice(event.device));
    }
}

export function* startTest({ payload }) {
    const { mainFile, breakpoints, runtimeSettings } = yield select(state => state.test);
    // check if main file of the test is saved (e.g. unmodified)
    const file = mainFile ? yield select(state => state.fs.files[mainFile]) : null;
    if (!file) {
        yield put({
            type: failure(ActionTypes.TEST_START),
            payload: { error: { type: ActionTypes.TEST_ERR_MAIN_SCRIPT_NOT_SELECTED } },
        });
        return;
    }
    // check if file content exist (e.g. was pre-loaded from the file)
    else if (!file.hasOwnProperty('content') || typeof(file.content) !== 'string') {
        return;     // silently ignore it
    } 
    else if (file.content.trim().length == 0) {
        yield put({
            type: failure(ActionTypes.TEST_START),
            payload: { error: { type: ActionTypes.TEST_ERR_MAIN_SCRIPT_IS_EMPTY } },
        });
        return;
    }
    else if (file.modified) {
        yield put({
            type: failure(ActionTypes.TEST_START),
            payload: { error: { type: ActionTypes.TEST_ERR_MAIN_SCRIPT_NOT_SAVED } },
        });
        return;
    }
    try {        
        // reset active line cursor in all editors
        yield put(editorActions.resetActiveLines());
        // reset General log
        yield put(loggerActions.resetGeneralLogs());
        // call TestRunner service to start the test
        yield call(services.mainIpc.call, 'TestRunnerService', 'start', [ mainFile, breakpoints, runtimeSettings ]);
        yield put({
            type: success(ActionTypes.TEST_START),
            payload: null,
        });
    }
    catch (err) {
        /* istanbul ignore next */
        yield put({
            type: failure(ActionTypes.TEST_START),
            payload: { error: err },
        });
    }
}

export function* stopTest({ payload }) {
    try {
        // call TestRunner service to stop the test
        yield call(services.mainIpc.call, 'TestRunnerService', 'stop');
        yield put({
            type: success(ActionTypes.TEST_STOP),
            payload: null,
        });
    }
    catch (err) {
        /* istanbul ignore next */
        yield put({
            type: failure(ActionTypes.TEST_STOP),
            payload: { error: err },
        });
    }
}

export function* continueTest({ payload }) {
    try {
        // call TestRunner service to stop the test
        yield call(services.mainIpc.call, 'TestRunnerService', 'continue');
        yield put({
            type: success(ActionTypes.TEST_CONTINUE),
            payload: null,
        });
    }
    catch (err) {
        /* istanbul ignore next */
        yield put({
            type: failure(ActionTypes.TEST_CONTINUE),
            payload: { error: err },
        });
    }
}

