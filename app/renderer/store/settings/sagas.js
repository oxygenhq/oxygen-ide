/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, call } from 'redux-saga/effects';
import * as ActionTypes from './types';
import * as types from '../types';
import * as tabActions from '../tabs/actions';
import * as editorActions from '../editor/actions';
import * as testActions from '../test/actions';
import * as settingsActions from './actions';
import { reportError } from '../sentry/actions';
import * as Const from '../../../const';
import { MAIN_MENU_EVENT } from '../../services/MainIpc';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

/**
 * Settings Sagas
 */

export default function* root() {
    yield all([
        takeLatest(ActionTypes.LOGGER_SET_VISIBLE, onSetLoggerVisible),
        takeLatest(ActionTypes.TMP_ADD_FILE, tmpAddFile),
        takeLatest(ActionTypes.TMP_REMOVE_FILE, tmpRemoveFile),
        takeLatest(ActionTypes.TMP_UPDATE_FILE_CONTENT, tmpUpdateFileContent),
        takeLatest(ActionTypes.FIRST_OPEN, firstOpen),
        takeLatest(MAIN_MENU_EVENT, handleMainMenuEvents),
        takeLatest(types.default.TEST_UPDATE_BREAKPOINTS, testUpdateBreakpoints)
    ]);
}


export function* testUpdateBreakpoints({ payload }){
        
    const FONT_SIZE_MIN = 12;
    const FONT_SIZE_MAX = 36;

    const settings = yield select(state => state.settings);
    
    if(
        settings && 
        settings.fontSize && 
        parseInt(settings.fontSize) && 
        settings.fontSize >= FONT_SIZE_MIN && 
        settings.fontSize <= FONT_SIZE_MAX
    ) {
        // ignore, all good
    } else {
        yield put(settingsActions.setZoom(FONT_SIZE_MIN));
    }

    const test = yield select(state => state.test);

    const { isRunning } = test;
    const { breakpoints, path } = payload;

    const testBreakpoints = test.breakpoints;

    if(isRunning){
        // right now run test
        if(testBreakpoints && testBreakpoints[path]){
            // the file where breackpoints changed in files, where test runs

            yield put(testActions.waitUpdateBreakpoints(true));
            const start = new Date();
            const result = yield call(services.mainIpc.call, 'TestRunnerService', 'updateBreakpoints', [ breakpoints, path ]);
            const end = new Date();
            const duration = (end - start);
            console.log('TestRunnerService updateBreakpoints takes ' + duration + ' ms ');
            console.log('TestRunnerService updateBreakpoints result', result);
            yield put(testActions.waitUpdateBreakpoints(false));
            
        }
    }
}

export function* firstOpen({ payload }){
    yield put(tabActions.addTab('welcome', 'Welcome'));
    yield put(tabActions.setActiveTab('welcome', 'Welcome'));
    yield put(editorActions.setActiveFile('welcome', 'Welcome'));
    yield put(editorActions.addFile('welcome', 'Welcome'));
}

export function* tmpAddFile({ payload }) {
    if (payload && payload.key && payload.name) {
        const { key, name, content } = payload;
        try {            
            const newSettings = yield call(services.mainIpc.call, 'ElectronService', 'addFile', [key, name, content]);
            if(newSettings){
                yield put(settingsActions.mergeSettings(newSettings));
            }
        } catch (err) {
            yield put(reportError(err));
            console.warn('err', err);
        }
    }
}

export function* tmpRemoveFile({ payload }) {

    if (payload && payload.key && payload.name) {
        const { key, name } = payload;
        try {            
            const newSettings = yield call(services.mainIpc.call, 'ElectronService', 'removeFile', [key, name]);
            
            if(newSettings){
                yield put(settingsActions.mergeSettings(newSettings));
            }
        } catch (err) {
            yield put(reportError(err));
            console.warn('err', err);
        }
    }
}

export function* tmpUpdateFileContent({ payload }) {
    if (payload && payload.path && payload.name && typeof payload.content !== 'undefined') {
        const { path, name, content } = payload;
        try {
            const newSettings = yield call(services.mainIpc.call, 'ElectronService', 'updateFileContent', [path, name, content]);
            
            if(newSettings){
                yield put(settingsActions.mergeSettings(newSettings));
            }
        } catch (err) {
            yield put(reportError(err));
            console.warn('err', err);
        }
    }
}

export function* handleMainMenuEvents({ payload }) {
    const { cmd } = payload;
    if (!cmd) {
        return;
    }
    if(cmd === Const.MENU_CMD_VIEW_ZOOM_IN) {
        yield put(settingsActions.zoomIn());
    }
    if(cmd === Const.MENU_CMD_VIEW_ZOOM_OUT) {
        yield put(settingsActions.zoomOut());
    }
    if(cmd === Const.MENU_CMD_VIEW_ZOOM_TO_DEFAULT) {
        yield put(settingsActions.zoomToDefault());
    }
}

export function* onSetLoggerVisible({ payload }) {
    const { value = true } = payload;
    // update View Logger menu state to reflect Logger's visibility
    const settings = {
        [Const.MENU_CMD_VIEW_EVENT_LOG]: {
            selected: value,
        },
    };
    yield call(services.mainIpc.call, 'MenuService', 'update', [settings]);
}
