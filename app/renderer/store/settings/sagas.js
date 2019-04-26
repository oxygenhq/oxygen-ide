/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, take, call } from 'redux-saga/effects';
import * as ActionTypes from './types';
import * as settingsActions from './actions';
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
      takeLatest(MAIN_MENU_EVENT, handleMainMenuEvents),
    ]);
}


export function* tmpAddFile({ payload }) {
    if (payload && payload.key && payload.name) {
        const { key, name } = payload;
        try {            
            const newSettings = yield call(services.mainIpc.call, 'ElectronService', 'addFile', [key, name]);
            
            if(newSettings){
                yield put(settingsActions.mergeSettings(newSettings));
            }
        } catch (err) {
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
            console.warn('err', err);
        }
    }
}

export function* tmpUpdateFileContent({ payload }) {
    if (payload && payload.path && payload.name && payload.content) {
        const { path, name, content } = payload;
        try {            
            const newSettings = yield call(services.mainIpc.call, 'ElectronService', 'updateFileContent', [path, name, content]);
            
            if(newSettings){
                yield put(settingsActions.mergeSettings(newSettings));
            }
        } catch (err) {
            console.warn('err', err);
        }
    }
}

export function* handleMainMenuEvents({ payload }) {
    const { cmd, args } = payload;
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
