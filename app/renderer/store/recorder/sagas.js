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
import { toOxygenCode } from '../../helpers/recorder';

import { success, failure, successOrFailure } from '../../helpers/redux';
import * as recorderActions from './actions';
import * as wbActions from '../workbench/actions';
import ActionTypes from '../types';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

/**
 * Recorder Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.RECORDER_START, startRecorder),
      takeLatest(ActionTypes.RECORDER_STOP, stopRecorder),
      takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
    ]);
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;

    if (!event) {
        return;
    }
    if (service === 'RecorderService' && event.type === 'RECORDER_EVENT') {        
        const step = {
            module: event.module,
            cmd: event.cmd,
            target: event.target || null,
            locators: event.targetLocators || null,
            value: event.value || null,
            timestamp: event.timestamp || (new Date()).getTime(),
        };
        yield put(recorderActions.addStep(step));
        const currentOpenFile = yield select(state => state.recorder.activeFile);
        if (!currentOpenFile) {
            return;
        }
        const file = yield select(state => state.fs.files[currentOpenFile]);
        if (!file) {
            return;
        }
        // generated code
        const generatedCode = toOxygenCode([ step ]);
        // current code, before update (make sure to include new line at the end of the content)
        let prevContent = (file.content || '');
        if (!prevContent.endsWith('\n')) {
            prevContent += '\n';
        }
        const newContent = `${prevContent}${generatedCode}`;
        // append newly recorded content
        //yield put(fsActions.updateFileContent(currentOpenFile, newContent));
        yield put(wbActions.onContentUpdate(currentOpenFile, newContent));
    }
}

export function* startRecorder({ payload }) {
    const currentOpenFile = yield select(state => state.editor.activeFile);
    // if no file is currently open (no open tabs), then ignore the recording
    if (!currentOpenFile) {
        return;
    }
    yield call(services.mainIpc.call, 'RecorderService', 'start', []);
    yield put(recorderActions._startRecorder_Success(currentOpenFile));
}

export function* stopRecorder({ payload }) {
    yield call(services.mainIpc.call, 'RecorderService', 'stop', []);
}
