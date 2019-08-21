import { all, put, select, takeLatest, take, call } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';
import * as ActionTypes from './types';
import * as actions from './actions';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import { success, failure, successOrFailure } from '../../helpers/redux';

export default function* root() {
    yield all([
        takeLatest(ActionTypes.DIALOG_START_DOWNLOAD_CHROME_DRIVER, startDownloadChromeDriver),
        takeLatest(ActionTypes.DIALOG_SHOW_DOWNLOADING_CHROME_DRIVER_FAILED, showDownloadChromeDriverFailed),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
        takeLatest('SELENIUM_RUNTIME_ERROR', handleSeleniumRuntimeError)
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
}

export function* startDownloadChromeDriver({ payload }) {
    const { chromeDriverVersion } = payload;

    if(chromeDriverVersion){
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
        try{
            const result = yield services.mainIpc.call('SeleniumService', 'downloadChromeDriver', [chromeDriverVersion]);
    
            if(result){
                if(typeof result === 'object'){
                    //error object
                    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
                    if(path){
                        yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
                    }
                } else {
                    yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                    yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS));
                }
            }
        } catch(e){
            console.warn('startDownloadChromeDriver error in saga', e);
            const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
            if(path){
                yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
            }
        }
    }
    
}

function* showDownloadChromeDriverFailed(){
    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
    if(path){
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
    }
}

function* handleSeleniumServiceEvent(event) {

    if(event && event.type === 'ON_CHROME_DRIVER_ERROR'){
        yield put(actions.setParamstoDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, {
            chromeDriverVersion: event.chromeDriverVersion,
            chromeVersion: event.chromeVersion
        }));
    }
}

function* handleSeleniumRuntimeError(event) {

    const result = yield services.mainIpc.call('SeleniumService', 'getChromeDriverVersionAndChromeVersion');


    if(result){
        const {
            chromeDriverVersion,
            chromeVersion,
            error
        } = result;

        if(error && chromeDriverVersion && chromeVersion){
             yield put(actions.showDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, {chromeDriverVersion, chromeVersion}));
        } else if(error && chromeVersion){
            yield put(actions.showDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, { chromeVersion }));
        }
    }
}