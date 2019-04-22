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
      takeLatest(ActionTypes.RECORDER_START_WATCHER, startRecorderWatcher),
      takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
    ]);
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;

    if (!event) {
        return;
    }
    if (service === 'RecorderService' && event.type === 'CHROME_EXTENSION_ENABLED') {
        yield put(recorderActions.setLastExtentionEnabledTimestamp(Date.now()));
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

        const recorder = yield select(state => state.recorder);

        const { activeFile, activeFileName } = recorder;
        
        if(activeFile === 'unknown'){
            
            if (!activeFileName) {
                return;
            }

            const file = yield select(state => state.settings.files[activeFile+activeFileName]);

    
            if (!file) {
                return;
            }
            // generated code
            const generatedCode = toOxygenCode([ step ]);
            // current code, before update (make sure to include new line at the end of the content)
            let prevContent = file.content;
            if (!prevContent.endsWith('\n') && prevContent !== '') {
                prevContent += '\n';
            }
            // prepend web.init if it doesn't exist in the script
            if (file.content.indexOf('web.init') === -1) {
                prevContent += 'web.init();\n';
            }
            const newContent = `${prevContent}${generatedCode}`;
            // append newly recorded content
            yield put(wbActions.onContentUpdate(activeFile, newContent, activeFileName));

        } else {
            if (!activeFile) {
                return;
            }
            const file = yield select(state => state.fs.files[activeFile]);
        
            if (!file) {
                return;
            }
    
            // generated code
            const generatedCode = toOxygenCode([ step ]);
            // current code, before update (make sure to include new line at the end of the content)
            let prevContent = file.content;
            if (!prevContent.endsWith('\n') && prevContent !== '') {
                prevContent += '\n';
            }
            // prepend web.init if it doesn't exist in the script
            if (file.content.indexOf('web.init') === -1) {
                prevContent += 'web.init();\n';
            }
            const newContent = `${prevContent}${generatedCode}`;
            // append newly recorded content
            yield put(wbActions.onContentUpdate(activeFile, newContent));
        }

    }
}

export function* startRecorder({ payload }) {
    const editor = yield select(state => state.editor);
    const { activeFile } = editor;

    // if no file is currently open (no open tabs), then ignore the recording
    if (!activeFile) {
        
        const resp = yield putAndTake(wbActions.openFakeFile());
        
        if(resp && resp.key && resp.name){
            const { key, name } = resp;
            
            yield call(services.mainIpc.call, 'RecorderService', 'start', []);
            yield put(recorderActions._startRecorder_Success(key, name));
        } else {
            yield put(recorderActions._startRecorder_Failure(undefined, { code: 'NO_ACTIVE_FILE' }));
            return;
        }
    } else {
        yield call(services.mainIpc.call, 'RecorderService', 'start', []);
        yield put(recorderActions._startRecorder_Success(activeFile));
    }
}

export function* stopRecorder({ payload }) {    
    yield call(services.mainIpc.call, 'RecorderService', 'stop', []);
}

export function* startRecorderWatcher({}){
    yield call(services.mainIpc.call, 'RecorderService', 'watch', []);
}