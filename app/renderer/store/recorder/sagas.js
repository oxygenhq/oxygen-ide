/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { notification } from 'antd';
import { all, put, select, takeLatest, take, call, actionChannel } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';
import { toOxygenCode } from '../../helpers/recorder';

import { success, failure, successOrFailure } from '../../helpers/redux';
import * as recorderActions from './actions';
import * as editorActions from '../editor/actions';
import * as wbActions from '../workbench/actions';
import ActionTypes from '../types';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

let lastExtensionTime = 0;
let canRecord = false;
let stopWaitChromeExtension = false;
let waitChromeExtension = true;

const timer = () => {
    if(lastExtensionTime){
        let newCanRecord = false;
        const now = Date.now();
        const diff = now - lastExtensionTime;

        if(diff && diff > 2000){
            newCanRecord = false;
        } else {
            newCanRecord = true;
        }

        if(newCanRecord !== canRecord){
            canRecord = newCanRecord;
            if(window && window.dispatch){
                window.dispatch(recorderActions.changeCanRecord(newCanRecord));

                if(!newCanRecord){
                    window.dispatch(recorderActions.stopRecorder());
                }
            }
        }
    }

    if(waitChromeExtension){
      // extension not finded
      if(window && window.dispatch){
        window.dispatch(recorderActions.stopWaitChromeExtension());
        waitChromeExtension = false;
      }
    }
}

window.intervalId = setInterval(timer, 2000);

/**
 * Recorder Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.RECORDER_START, startRecorder),
      takeLatest(ActionTypes.RECORDER_STOP, stopRecorder),
      takeLatest(ActionTypes.RECORDER_START_WATCHER, startRecorderWatcher),
      takeLatest(success(ActionTypes.WB_CLOSE_FILE), wbCloseFileSuccess),
      takeLatest('MAIN_SERVICE_EVENT', handleServiceEvents),
      takeLatest('RECORDER_SERVICE_ADD_STEP', recorderAddStep),
      takeLatest('RESET', initialize)
    ]);
}


export function* initialize() {
    lastExtensionTime = 0;
    canRecord = false;
    stopWaitChromeExtension = false;
    waitChromeExtension = true;

    if(window.intervalId){
        clearTimeout(window.intervalId);
    }
    
    window.intervalId = setInterval(timer, 2000);

    return;
}

export function* stopRecorderAfterFileClose(){
    yield put(wbActions.stopRecorder());
    const errorWithFileMessage = 'Recording will stop now because the file was closed';
    notification['error']({
        message: 'Recording stopped',
        description: errorWithFileMessage
    });
}

export function* wbCloseFileSuccess({ payload }) {
    const recorder = yield select(state => state.recorder);
    const editor = yield select(state => state.editor);
    const tabs = yield select(state => state.tabs);

    const { activeFile, activeFileName, isRecording } = recorder;

    if(isRecording){
        if(payload && payload.path){
            if(payload.path === "unknown") {
                if(payload.path === activeFile && payload.name === activeFileName){
                    yield stopRecorderAfterFileClose();
                }
            } else {
                if(payload.path === activeFile){
                    yield stopRecorderAfterFileClose();
                }
            }
        }
    }

    if(tabs.active !== editor.activeFile && tabs.activeTitle !== editor.activeFileName){
        yield put(editorActions.setActiveFile(tabs.active, tabs.activeTitle));
    }

    return;
}


export function* recorderAddStep({ payload }) {
    const channel = yield actionChannel("RECORDER_SERVICE_ADD_STEP");

    while(true) {
        const { payload } = yield take(channel);
        const resp = yield call(handleRequest, payload)
    }

}

function* handleRequest(payload) {
    try {

        const { event } = payload;
    
        const recorder = yield select(state => state.recorder);
    
        const { activeFile, activeFileName, isRecording } = recorder;
    
        if(!isRecording){
            //ignore messages from RecorderService because recording process not started
            return;
        }
        
        let generatedCode = '';
        const steps = [];    
        if(event.stepsArray && Array.isArray(event.stepsArray)){
    
            yield all(
                event.stepsArray.map((item) => call(function* () {
                    const step = {
                        module: item.module,
                        cmd: item.cmd,
                        target: item.target || null,
                        locators: item.targetLocators || null,
                        value: item.value || null,
                        timestamp: item.timestamp || (new Date()).getTime(),
                    };
    
                    // generated code
                    generatedCode += toOxygenCode([ step ]);
    
                    steps.push(step);
                }))
            );
        }
        
        if(activeFile === 'unknown'){
            
            if (!activeFileName) {
                yield stopRecorderAfterFileClose();
                return;
            }
    
            const file = yield select(state => state.settings.files[activeFile+activeFileName]);
    
            
            if (!file) {
                yield stopRecorderAfterFileClose();
                return;
            }
            // current code, before update (make sure to include new line at the end of the content)
            let prevContent = file.content;
    
            if(!prevContent){
                prevContent = '';
            }
    
            if (!prevContent.endsWith('\n') && prevContent !== '') {
                prevContent += '\n';
            }
            // prepend web.init if it doesn't exist in the script
            if (prevContent.indexOf('web.init') === -1) {
                prevContent += 'web.init();\n';
            }
    
            const newContent = `${prevContent}${generatedCode}`;
            yield all([
                put(wbActions.onContentUpdate(activeFile, newContent, activeFileName)),
                put(recorderActions.addSteps(steps))
            ])
        } else {
            if (!activeFile) {
                yield stopRecorderAfterFileClose();
                return;
            }
            const file = yield select(state => state.fs.files[activeFile]);
        
            if (!file) {
                yield stopRecorderAfterFileClose();
                return;
            }
    
            // current code, before update (make sure to include new line at the end of the content)
            let prevContent = file.content;
    
            if(!prevContent){
                prevContent = '';
            }
    
            if (!prevContent.endsWith('\n') && prevContent !== '') {
                prevContent += '\n';
            }
            // prepend web.init if it doesn't exist in the script
            if (prevContent.indexOf('web.init') === -1) {
                prevContent += 'web.init();\n';
            }
            const newContent = `${prevContent}${generatedCode}`;
            // append newly recorded content
            yield all([
                put(wbActions.onContentUpdate(activeFile, newContent)),
                put(recorderActions.addSteps(steps))
            ])
        }    
    } catch(e) {
        console.log('e', e);
    }
}


export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;

    if (!event) {
        return;
    }
    if (service === 'RecorderService' && event.type === 'CHROME_EXTENSION_ENABLED') {
        const recorder = yield select(state => state.recorder);

        waitChromeExtension = recorder.waitChromeExtension;
        lastExtensionTime = Date.now();
    }
}

export function* startRecorder({ payload }) {
    const editor = yield select(state => state.editor);
    const { activeFile, activeFileName } = editor;
    
    // if no file is currently open (no open tabs), then ignore the recording
    if (!activeFile || activeFile === 'welcome') {
        
        const resp = yield putAndTake(wbActions.openFakeFile());
        
        if(resp && resp.key && resp.name){
            const { key, name } = resp;
            
            yield call(services.mainIpc.call, 'AnalyticsService', 'recStart', []);
            yield call(services.mainIpc.call, 'RecorderService', 'start', []);
            yield put(recorderActions._startRecorder_Success(key, name));
        } else {
            yield put(recorderActions._startRecorder_Failure(undefined, { code: 'NO_ACTIVE_FILE' }));
            return;
        }
    } else {
        yield call(services.mainIpc.call, 'AnalyticsService', 'recStart', []);
        yield call(services.mainIpc.call, 'RecorderService', 'start', []);
        yield put(recorderActions._startRecorder_Success(activeFile, activeFileName));
    }
}

export function* stopRecorder({ payload }) {
    let recorded_items_count = 0;
    const recorder = yield select(state => state.recorder);

    if(recorder && recorder.steps && Array.isArray(recorder.steps)){
        recorded_items_count = recorder.steps.length;
    }

    yield call(services.mainIpc.call, 'AnalyticsService', 'recStop', [recorded_items_count]);
}

export function* startRecorderWatcher({}){
    yield call(services.mainIpc.call, 'RecorderService', 'watch', []);
}