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
import * as wbActions from '../workbench/actions';
import * as editorActions from '../editor/actions';
import * as tabActions from '../tabs/actions';
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
        takeLatest(ActionTypes.TEST_EVENT_LINE_UPDATE, handleOnLineUpdate)
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

        if(event && event.result && event.result.summary){
            const { summary } = event.result;
            if(summary && summary._status && summary._status ==='passed'){
                yield put(editorActions.resetActiveLines());
            }
            
            yield call(services.mainIpc.call, 'AnalyticsService', 'playStop', [summary]);
        }
    }
    else if (event.type === 'LINE_UPDATE') {
        yield put(testActions.onLineUpdate(event.time, event.file, event.line, event.primary));
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
    } else if(event.type === 'XCODE_ERROR'){
        yield put(wbActions.setXCodeError());
    }
}

export function* startTest({ payload }) {
    const { mainFile, breakpoints, runtimeSettings } = yield select(state => state.test);

    const editor = yield select(state => state.editor);

    let file;
    let saveMainFile;

    if(mainFile){
        // check if main file of the test is saved (e.g. unmodified)
        file = yield select(state => state.fs.files[mainFile]);
        saveMainFile = mainFile;
    } else if (editor && editor.activeFile){
        // check if main file of the test is saved (e.g. unmodified)
        file = yield select(state => state.fs.files[editor.activeFile]);
        saveMainFile = editor.activeFile;
    }

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
        yield put(wbActions.saveCurrentFile());
    }
    // clone runtime settings and add cloud provider information, if a provider was selected
    const runtimeSettingsClone = {
        ...runtimeSettings
    };
    // add test provider information
    if (runtimeSettings.testProvider) {
        const cloudProviders = yield select(state => state.settings.cloudProviders);
        runtimeSettingsClone.testProvider = cloudProviders.hasOwnProperty(runtimeSettings.testProvider) ? { ...cloudProviders[runtimeSettings.testProvider], id: runtimeSettings.testProvider } : null;
    }
    // add device information 
    if (runtimeSettings.testTarget && runtimeSettings.testMode === 'mob') {
        const devices = yield select(state => state.test.devices);
        const targetDevice = devices.find(x => x.id === runtimeSettings.testTarget);
        runtimeSettingsClone.testTarget = targetDevice;
    }

    try {        
        // reset active line cursor in all editors
        yield put(editorActions.resetActiveLines());
        // reset General log
        yield put(loggerActions.resetGeneralLogs());
        // call TestRunner service to start the test
        
        yield call(services.mainIpc.call, 'AnalyticsService', 'playStart', []);
        const TestRunnerServiceResult = yield call(services.mainIpc.call, 'TestRunnerService', 'start', [ saveMainFile, breakpoints, runtimeSettingsClone ]);        
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
        
        // reset active line cursor in all editors
        yield put(editorActions.resetActiveLines());
        
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

export function* handleOnLineUpdate ({ payload }) {
    const { file, line, primary, time } = payload || {};
    // check if this is the primary file and if yes, make sure to make its tab active
    if (primary) {
        const openFiles = yield select(state => state.editor.openFiles);
        // check if we have this file open in one of the editors
        if (openFiles[file]) {
            yield put(tabActions.setActiveTab(file));
            yield put(editorActions.setActiveFile(file));
        }
    }
    yield put(editorActions.setActiveLine(time, file, line));
}
