import { all, put, takeLatest } from 'redux-saga/effects';
import * as ActionTypes from './types';
import * as actions from './actions';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';
import { reportError } from '../sentry/actions';
import ServicesSingleton from '../../services';
const services = ServicesSingleton();


export default function* root() {
    yield all([
        takeLatest(ActionTypes.DIALOG_START_DOWNLOAD_CHROME_DRIVER, startDownloadChromeDriver),
        takeLatest(ActionTypes.DIALOG_SHOW_DOWNLOADING_CHROME_DRIVER_FAILED, showDownloadChromeDriverFailed),
        takeLatest(ActionTypes.DIALOG_START_DOWNLOAD_EDGE_DRIVER, startDownloadEdgeDriver),
        takeLatest(ActionTypes.DIALOG_SHOW_DOWNLOADING_EDGE_DRIVER_FAILED, showDownloadEdgeDriverFailed),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents)
    ]);
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;
    if (!event) {
        return;
    }
    if (['SeleniumService','TestRunnerService'].includes(service)) {
        yield handleOnChromeDriverErrorEvent(event);
    }
}

export function* startDownloadChromeDriver({ payload }) {
    const { chromeDriverVersion } = payload;

    if (chromeDriverVersion) {
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
        try {
            const result = yield services.mainIpc.call('SeleniumService', 'downloadChromeDriver', [chromeDriverVersion]);
    
            if (result) {
                if (typeof result === 'object') {
                    //error object
                    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
                    if (path) {
                        yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
                    }
                } else {
                    yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                    yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS));
                }
            }
        } catch (e) {
            yield put(reportError(e));
            console.warn('startDownloadChromeDriver error in saga', e);
            const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
            if (path) {
                yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER));
                yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
            }
        }
    }
    
}

function* showDownloadChromeDriverFailed() {
    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
    if (path) {
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED, {path}));
    }
}

function* startDownloadEdgeDriver({ payload }) {
    const { edgeDriverVersion } = payload;

    if (edgeDriverVersion) {
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER));
        try {
            const result = yield services.mainIpc.call('SeleniumService', 'downloadEdgeDriver', [edgeDriverVersion]);
    
            if (result) {
                if (typeof result === 'object') {
                    //error object
                    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
                    if (path) {
                        yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER));
                        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED, {path}));
                    }
                } else {
                    yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER));
                    yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER_SUCCESS));
                }
            }
        } catch (e) {
            yield put(reportError(e));
            console.warn('startDownloadEDGEDriver error in saga', e);
            const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
            if (path) {
                yield put(actions.hideDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER));
                yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED, {path}));
            }
        }
    }
}

function* showDownloadEdgeDriverFailed() {
    const path = yield services.mainIpc.call('SeleniumService', 'getDriversRootPath');
    if (path) {
        yield put(actions.showDialog(ActionTypes.DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED, {path}));
    }
}

export function* handleOnChromeDriverErrorEvent(event) {
    if (event.type === 'ON_CHROME_DRIVER_ERROR') {
        yield put(actions.setParamstoDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, {
            chromeVersion: event.chromeVersion
        }));
        yield put(actions.showDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, event));
    }
    if (event.type === 'ON_EDGE_DRIVER_ERROR') {
        yield put(actions.setParamstoDialog(ActionTypes.DIALOG_INCORECT_EDGE_DRIVER_VERSION, {
            edgeDriverVersion: event.edgeDriverVersion,
            edgeVersion: event.edgeVersion
        }));
        yield put(actions.showDialog(ActionTypes.DIALOG_INCORECT_EDGE_DRIVER_VERSION, event));
    }
    if (event.type === 'ON_EDGE_FINDED') {
        yield put(actions.storeEdgeBinaryPath(event.path));
    }
    if (event.type === 'ON_CHROME_DRIVER_ERROR_AFTER_TEST_ENDED') {
        yield services.mainIpc.call('SeleniumService', 'findChromeDriverVersion');
    }
    if (event.type === 'ON_FINDED_CHROME_DRIVER_VERSION') {
        if (event.chromeVersion) {
            yield put(actions.setParamstoDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION, {
                chromeVersion: event.chromeVersion
            }));
        }
        yield put(actions.showDialog(ActionTypes.DIALOG_INCORECT_CHROME_DRIVER_VERSION));
    }
}
