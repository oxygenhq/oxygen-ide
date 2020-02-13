/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';
import * as fsActions from '../fs/actions';
import * as editorActions from './actions';
import { success } from '../../helpers/redux';
import ActionTypes from '../types';

/**
 * Editor Sagas
 */
export default function* root() {
    yield all([
        takeLatest(ActionTypes.EDITOR_OPEN_FILE, openFile),
        takeLatest(success(ActionTypes.FS_RENAME), handleFileRename),
    ]);
}

export function* openFile({ payload }) {
    const { path, setActive } = payload;
    const openFiles = yield select(state => state.editor.openFiles);
    // check if file has been already proceeded by the editor (e.g. was open at least once) 
    if (openFiles[path]) {
        if (setActive) {
            yield put(editorActions.setActiveFile(path));
        }
        yield put(editorActions._openFile_Success(path));
        return;
    }
    // if file is not cached in the editor, let's fetch its content and add it to the editor
    const { error } = yield putAndTake(
        fsActions.fetchFileContent(path)
    );
    if (error) {
        yield put(editorActions._openFile_Failure(path, error));
        return;
    }
    
    // const file = fileCache[path];
    // if (!file || !file.hasOwnProperty('content')) {
    //     yield put(editorActions._openFile_Failure(path, { message: 'File not found in the file cache or content is missing.'} ));
    //     return;
    // }

    yield put(editorActions.addFile(path));
    yield put(editorActions.setActiveFile(path));
    yield put(editorActions._openFile_Success(path));
}

export function* handleFileRename({ payload }) {
    const { oldPath, newFile } = payload;
    const openFiles = yield select(state => state.editor.openFiles);
    // check if the renamed file is open in the editor
    if (openFiles[oldPath]) {
        // update file path reference in case the renamed file is open in the editor
        yield put(editorActions.renameFile(oldPath, newFile.path));
    }
}
