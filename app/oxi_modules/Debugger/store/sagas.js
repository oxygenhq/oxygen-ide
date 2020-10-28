/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, takeLatest, put, select } from 'redux-saga/effects';
import { MAIN_SERVICE_EVENT } from '../../../renderer/services/MainIpc';
import * as tabActions from '../../../renderer/store/tabs/actions';
import * as editorActions from '../../../renderer/store/editor/actions';

/* Helpers */
// import { putAndTake } from '../../../renderer/helpers/saga';
// import { convertToObjectTree, getRepositoryNameFromFileName } from '../../../renderer/helpers/objrepo';

/* Types */
import * as ActionTypes from './types';
import * as actions from './actions';
/* Services */
// import ServicesSingleton from '../../services';
// const services = ServicesSingleton();

/**
 * Object Repository Sagas
 */
export default function* root() {
    yield all([
        takeLatest(ActionTypes.DBG_STEP_START, stepStart),
        takeLatest(ActionTypes.DBG_STEP_END, stepEnd),
        takeLatest(ActionTypes.DBG_SET_SELECTED, openDebugTab),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
        takeLatest('TEST_START', handleTestStart),
        takeLatest('TEST_START_SUCCESS', handleTestEnd),
    ]);
}

export function* handleTestStart() {
    yield put(actions.cleanup());
    
    const switchToDebugger = yield select(state => state.settings.runSettings.switchToDebugger);
    if (switchToDebugger) {
        yield put(actions.changeMode('debug'));
    }
}

export function* handleTestEnd() {
    const switchToDebugger = yield select(state => state.settings.runSettings.switchToDebugger);
    if (switchToDebugger) {
        yield put(actions.changeMode('default'));
    }
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;
    const { type } = event;

    if (service === 'TestRunnerService') {
        if (type === 'SUITE_STARTED') {
            yield put(actions.addEvent(event));
        }

        if (type === 'CASE_STARTED') {
            yield put(actions.addEvent(event));
        }

        if (type === 'STEP_STARTED') {
            yield put(actions.addEvent(event));
        }

        if (type === 'STEP_ENDED') {
            yield put(actions.addEvent(event));
        }

        if (type === 'CASE_ENDED') {
            yield put(actions.addEvent(event));
        }

        if (type === 'SUITE_ENDED') {
            yield put(actions.addEvent(event));
        }        
    }
}

export function* openDebugTab({ payload }) {
    yield put(tabActions.addTab('debugger', 'Debugger'));
    yield put(tabActions.setActiveTab('debugger', 'Debugger'));
    yield put(editorActions.setActiveFile('debugger', 'Debugger'));
    yield put(editorActions.addFile('debugger', 'Debugger'));
}

export function* stepStart() {
}

export function* stepEnd() {
}