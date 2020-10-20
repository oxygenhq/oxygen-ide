/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, takeLatest, put } from 'redux-saga/effects';
import { MAIN_SERVICE_EVENT } from '../../../renderer/services/MainIpc';

/* Helpers */
// import { putAndTake } from '../../../renderer/helpers/saga';
// import { convertToObjectTree, getRepositoryNameFromFileName } from '../../../renderer/helpers/objrepo';

/* Types */
import * as ActionTypes from './types';
import * as actions from './actions';
console.log('~~ActionTypes', ActionTypes);
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
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents)
    ]);
}


export function* handleServiceEvents({ payload }) {
    console.log('~~ TestDebugSetvice payload', payload);
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

export function* stepStart() {
}

export function* stepEnd() {
}