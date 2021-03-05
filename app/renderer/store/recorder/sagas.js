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

import { success } from '../../helpers/redux';
import * as recorderActions from './actions';
import * as editorActions from '../editor/actions';
import * as wbActions from '../workbench/actions';
import { reportError } from '../sentry/actions';
import ActionTypes from '../types';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

let canRecordChrome = false;
let canRecordFirefox = false;

/**
 * Recorder Sagas
 */
export default function* root() {
    yield all([
        takeLatest(ActionTypes.RECORDER_START, startRecorder),
        takeLatest(ActionTypes.RECORDER_STOP, stopRecorder),
        takeLatest(ActionTypes.RECORDER_START_WATCHER, startRecorderWatcher),
        takeLatest(success(ActionTypes.WB_CLOSE_FILE), wbCloseFileSuccess),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
        takeLatest(success(ActionTypes.RECORDER_START), recorderAddStepChannelInnit),
        takeLatest('CHROME_RECORDER_NEW_CAN_RECORD', chromeRecorderNewCanRecord),
        takeLatest('FIREFOX_RECORDER_NEW_CAN_RECORD', firefoxRecorderNewCanRecord),
        takeLatest('RESET', reset)
    ]);
}

export function reset() {
    canRecordChrome = false;
    canRecordFirefox = false;
}

export function* chromeRecorderNewCanRecord({ payload }) {
    const recorder = yield select(state => state.recorder);
    const { waitChromeExtension } = recorder;
    const { event } = payload;
    const { newCanRecord } = event;

    if (newCanRecord !== canRecordChrome) {
        canRecordChrome = newCanRecord;

        yield put(recorderActions.changeChromeCanRecord(newCanRecord));

        if (!newCanRecord) {
            yield put(recorderActions.stopRecorder());
        }
    }
    if (waitChromeExtension) {
        yield put(recorderActions.stopWaitChromeExtension());
    }
}

export function* firefoxRecorderNewCanRecord({ payload }) {
    const recorder = yield select(state => state.recorder);
    const { waitFirefoxExtension } = recorder;
    const { event } = payload;
    const { newCanRecord } = event;

    if (newCanRecord !== canRecordFirefox) {
        canRecordFirefox = newCanRecord;

        yield put(recorderActions.changeFirefoxCanRecord(newCanRecord));

        if (!newCanRecord) {
            yield put(recorderActions.stopRecorder());
        }
    }
    if (waitFirefoxExtension) {
        yield put(recorderActions.stopWaitFireFirefoxExtension());
    }
}

export function* stopRecorderAfterFileClose() {
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

    const { 
        isRecordingChrome,
        activeFileChrome,
        activeFileNameChrome,

        isRecordingFirefox,
        activeFileFirefox,
        activeFileNameFirefox
    } = recorder;

    if (isRecordingChrome) {
        if (payload && payload.path) {
            if (payload.path === 'unknown') {
                if (payload.path === activeFileChrome && payload.name === activeFileNameChrome) {
                    yield stopRecorderAfterFileClose();
                }
            } else {
                if (payload.path === activeFileChrome) {
                    yield stopRecorderAfterFileClose();
                }
            }
        }
    }

    if (isRecordingFirefox) {
        if (payload && payload.path) {
            if (payload.path === 'unknown') {
                if (payload.path === activeFileFirefox && payload.name === activeFileNameFirefox) {
                    yield stopRecorderAfterFileClose();
                }
            } else {
                if (payload.path === activeFileFirefox) {
                    yield stopRecorderAfterFileClose();
                }
            }
        }
    }

    if (tabs.active !== editor.activeFile && tabs.activeTitle !== editor.activeFileName) {
        yield put(editorActions.setActiveFile(tabs.active, tabs.activeTitle));
    }

    return;
}


export function* recorderAddStepChannelInnit({ payload }) {
    const channel = yield actionChannel('RECORDER_SERVICE_ADD_STEP');

    while (true) {
        const { payload } = yield take(channel);

        if (payload) {
            yield call(handleRequest, payload);
        }
    }

}

function* handleRequest(payload) {
    try {
        const { event } = payload;
        const recorder = yield select(state => state.recorder);
        const {
            isRecordingChrome,
            activeFileChrome,
            activeFileNameChrome,

            isRecordingFirefox,
            activeFileFirefox,
            activeFileNameFirefox,
        } = recorder;

        // const { activeFile, activeFileName, isRecordingChrome } = recorder;
    
        if (!isRecordingChrome && !isRecordingFirefox) {
            //ignore messages from RecorderService because recording process not started
            return;
        }

        let activeFile;
        let activeFileName;

        if (isRecordingChrome && event.browserName === 'chrome') {
            activeFile = activeFileChrome;
            activeFileName = activeFileNameChrome;
        } else if (isRecordingFirefox && event.browserName === 'firefox') {
            activeFile = activeFileFirefox;
            activeFileName = activeFileNameFirefox;
        } else {
            //ignore messages from RecorderService because browserName and recording mode miss match
            return;
        }
        
        let preGeneratedCode = '';
        let generatedCode = '';
        const steps = [];    
        if (event.stepsArray && Array.isArray(event.stepsArray)) {
    
            yield all(
                event.stepsArray.map((item) => call(function () {
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
        
        let filePath;

        if (activeFile === 'unknown') {
            filePath = activeFile+activeFileName;
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
    
            if (!prevContent) {
                prevContent = '';
            }
            // prepend web.init if it doesn't exist in the script
            if (prevContent.indexOf('web.init') === -1) {
                preGeneratedCode += '\nweb.init();';
            }
    
            yield put(recorderActions.addSteps(steps));
        } else {
            filePath = activeFile;
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
    
            if (!prevContent) {
                prevContent = '';
            }
            // prepend web.init if it doesn't exist in the script
            if (prevContent.indexOf('web.init') === -1) {
                preGeneratedCode += '\nweb.init();';
            }
            
            // append newly recorded content
            yield put(recorderActions.addSteps(steps));
        }    
    
        const elem = document.getElementById('editors-container-wrap');
        const addContentEvent = new CustomEvent('addContentEvent', {
            detail: {
                filePath: filePath,
                generatedCode: preGeneratedCode+'\n'+generatedCode
            }
        });
        elem.dispatchEvent(addContentEvent);

    } catch (e) {
        yield put(reportError(e));
        console.log('handleRequest e', e);
    }
}


export function handleServiceEvents({ payload }) {
    const { event } = payload;

    if (!event) {
        return;
    }
}

export function* startRecorder({ payload }) {
    const { browserName } = payload;

    let RecorderServiceMethod = 'startChrome';

    if (browserName && browserName === 'firefox') {
        RecorderServiceMethod = 'startFirefox';
    }
    
    const editor = yield select(state => state.editor);
    const { activeFile, activeFileName } = editor;
    
    // if no file is currently open (no open tabs), then ignore the recording
    if (!activeFile || activeFile === 'welcome') {
        
        const resp = yield putAndTake(wbActions.openFakeFile());
        
        if (resp && resp.key && resp.name) {
            const { key, name } = resp;
            
            yield call(services.mainIpc.call, 'AnalyticsService', 'recStart', []);
            yield call(services.mainIpc.call, 'RecorderService', RecorderServiceMethod, []);
            yield put(recorderActions._startRecorder_Success(key, name, browserName));
        } else {
            yield put(recorderActions._startRecorder_Failure(undefined, { code: 'NO_ACTIVE_FILE' }));
            return;
        }
    } else {
        yield call(services.mainIpc.call, 'AnalyticsService', 'recStart', []);
        yield call(services.mainIpc.call, 'RecorderService', RecorderServiceMethod, []);
        yield put(recorderActions._startRecorder_Success(activeFile, activeFileName, browserName));
    }
}

export function* stopRecorder({ payload }) {
    let recorded_items_count = 0;
    const recorder = yield select(state => state.recorder);

    if (recorder && recorder.steps && Array.isArray(recorder.steps)) {
        recorded_items_count = recorder.steps.length;
    }

    yield call(services.mainIpc.call, 'AnalyticsService', 'recStop', [recorded_items_count]);
}

export function* startRecorderWatcher() {
    yield call(services.mainIpc.call, 'RecorderService', 'watch', []);
}