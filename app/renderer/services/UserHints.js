/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, select, takeLatest, call } from 'redux-saga/effects';
import { MAIN_SERVICE_EVENT } from './MainIpc';

export default class UserHintsService {
    store = null;

    constructor(store) {
        this.store = store || null;
    }

    bind(store, action$) {
        this.store = store;
        this.action$ = action$;
    }

    *sagas() {
        yield all([
            takeLatest(MAIN_SERVICE_EVENT, ::this._onMainServiceEvent),
        ]);
    }

    *_onMainServiceEvent({ payload }) {
        const { event, service } = payload;
        const { message, severity, type } = event;
        if (service === 'TestRunnerService' && type === 'LOG_ENTRY') {
            yield this._analyzeTestRunnerLogs(message, severity);
        }
    }

    *_analyzeTestRunnerLogs(message, severity) {
        if ((message.indexOf('ECONNREFUSED') > -1 && message.indexOf('RuntimeError') > -1)
            || message.indexOf('APPIUM_UNREACHABLE_ERROR') > -1) {
            // get test mode
            const testMode = yield select(state => state.test.runtimeSettings.testMode);
            if (testMode === 'mob') {
                yield this._handleAppiumServerUnavailable();
            } else if (testMode === 'web') {
                alert('Invalid test mode selected: Web.\n\nTo run Mobile tests please select Mobile mode.');
            } else if (testMode === 'resp') {
                alert('Invalid test mode selected: Responsive.\n\nTo run Mobile tests please select Mobile mode.');
            }
        } else if (message.indexOf('INVALID_CAPABILITIES') > -1) {
            const testMode = yield select(state => state.test.runtimeSettings.testMode);
            if (message.indexOf('Failed to initialize `web` module - browserName must be specified.') > -1 &&
                testMode && testMode === 'mob') {
                alert('Invalid test mode selected: Mobile.\n\nTo run Web tests please select Web or Responsive mode.');
            }
        } else if (message.includes('SELENIUM_RUNTIME_ERROR') &&
            (message.includes('This version of ChromeDriver only supports Chrome version') ||
                message.includes('Chrome version must be between'))
        ){
            this.store.dispatch({
                type: 'SELENIUM_RUNTIME_ERROR',
                payload: {},
            });
        }
    }

    *_handleAppiumServerUnavailable() {
        if (!confirm('Appium server is not accessible.\n\nIn order to run mobile tests, you need to install and run Appium server manually.\n\nDo you want to read a tutorial on how to install and run Appium server?')) {
            return;
        }
        yield call(global.services.mainIpc.call, 'ElectronService', 'shellOpenExternal', ['http://docs.oxygenhq.org/download-and-installation/mobile-installation']);
    }
}
