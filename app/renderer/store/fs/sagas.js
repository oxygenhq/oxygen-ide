/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, take, call } from 'redux-saga/effects';
import { default as pathNode } from 'path';
import ActionTypes from '../types';
import * as fsActions from './actions';
import { success, failure, successOrFailure } from '../../helpers/redux';
import { putAndTake } from '../../helpers/saga';
import fileSubjects from '../../store/fs/subjects';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

/**
 * File System and File Explorer Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.FS_FETCH_FOLDER_CONTENT, fetchFolderContent),
      takeLatest(ActionTypes.FS_FETCH_FILE_CONTENT, fetchFileContent),
      takeLatest(ActionTypes.FS_FETCH_FILE_INFO, fetchFileInfo),
      takeLatest(ActionTypes.FS_CREATE_FOLDER, createFolder),
      takeLatest(ActionTypes.FS_CREATE_FILE, createFile),
      takeLatest(ActionTypes.FS_RENAME, renameFileOrFolder),
      takeLatest(ActionTypes.FS_DELETE, deleteFileOrFolder),
      takeLatest(ActionTypes.FS_SAVE_FILE, saveFileContent),
      takeLatest(ActionTypes.FS_SAVE_FILE_AS, saveFileContentAs),
      takeLatest(ActionTypes.FS_TREE_OPEN_FOLDER, treeOpenFolder),      
      takeLatest(ActionTypes.FS_TREE_LOAD_NODE_CHILDREN, treeLoadNodeChildren),
    ]);
}

export function* treeLoadNodeChildren({ payload }) {
    const { node, path, force } = payload;
    // if 'path' is provided, use path - if not, use node.path instead
    const folderPath = path || node.path;
    let folder = yield select(state => state.fs.files[folderPath]);
    if (!folder || !folder.children || force) {
        const { response, error } = yield putAndTake(fsActions.fetchFolderContent(folderPath));
        if (error) {
            yield put(fsActions.treeLoadNodeChildrenFailure(folderPath, error));
            return;
        }
        folder = response;
    }
    yield put(fsActions.treeLoadNodeChildrenSuccess(folderPath, folder.children));
}

export function* treeOpenFolder({ payload }) {
    const { path } = payload;
    yield _fetchFolderContent(path);
    const folder = yield select(state => state.fs.files[path]);  
    yield put(fsActions._treeOpenFolder_Success(path, folder.children));
}

export function* _fetchFolderContent(path) {
    try {
        let folder = yield call(services.mainIpc.call, 'FileService', 'getFolderContent', [ path ]);
        yield put({
            type: success(ActionTypes.FS_FETCH_FOLDER_CONTENT),
            payload: { path, response: folder },
        });
        return folder;
    }
    catch (err) {
        /* istanbul ignore next */
        yield put({
            type: failure(ActionTypes.FS_FETCH_FOLDER_CONTENT),
            payload: { error: err },
        });
        throw err;
    }
}

export function* fetchFolderContent({ payload }) {
    const { path } = payload;
    try {
        yield _fetchFolderContent(path);
    }
    catch (err) {

    }
}

export function* fetchFileContent({ payload }) {
    const { path } = payload;
    try {
        let file = yield select(state => state.fs.files[path]);
        if (!file) {
            const { response, error } = yield putAndTake(fsActions.fetchFileInfo(path));
            let file = yield select(state => state.fs.files[path]);
        }
        const content = yield call(services.mainIpc.call, 'FileService', 'getFileContent', [ path ]);
        yield put(fsActions._fetchFileContent_Success(path, content));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._fetchFileContent_Failure(path, err));
    }
}

export function* fetchFileInfo({ payload }) {
    const { path } = payload;
    try {
        const info = yield call(services.mainIpc.call, 'FileService', 'getFileInfo', [ path ]);
        yield put(fsActions._fetchFileInfo_Success(path, info));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._fetchFileInfo_Failure(path, err));
    }
}

export function* saveFileContent({ payload }) {
    const { path } = payload;
    try {
        const file = yield select(state => state.fs.files[path]);
        if (!file) {
            return;
        }
        const content = file.content;
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  content]);
        yield put(fsActions._saveFile_Success(path));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._saveFile_Failure(path, err));
    }
}

export function* saveFileContentAs({ payload }) {
    const { path, content } = payload;
    try {
        if (!path || !content) {
            console.warn('Invalid arguments - saga: FS, method: saveFileContentAs.');
            return;
        }
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  content]);
        const { response, error } = yield putAndTake(fsActions.fetchFileInfo(path));
        yield put(fsActions._saveFileAs_Success(path, content, response));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._saveFileAs_Failure(path, err));
    }
}

export function* renameFileOrFolder({ payload }) {
    const { path, newName } = payload;
    if (!path || !newName) {
        console.warn('Invalid arguments - saga: FS, method: renameFileOrFolder.');
        return;
    }
    try {
        const fileInfo = yield call(services.mainIpc.call, 'FileService', 'renameFileOrFolder', [path, newName]);
        // raise FILE.RENAMED event
        yield fileSubjects["FILE.RENAMED"].next({ oldPath: path, newPath: fileInfo.path });
        // refresh File Explorer tree since we need to sort again
        yield put(fsActions.treeLoadNodeChildren(pathNode.dirname(path), true));
        // report success
        yield put(fsActions._rename_Success(path, fileInfo));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._rename_Failure(path, err));
    }
}

export function* deleteFileOrFolder({ payload }) {
    const { path } = payload;
    if (!path) {
        console.warn('Invalid arguments - saga: FS, method: deleteFileOrFolder.');
        return;
    }
    try {
        yield call(services.mainIpc.call, 'FileService', 'deleteFileOrFolder', [ path ]);
        yield put(fsActions._delete_Success(path));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._delete_Failure(path, err));
    }
}

export function* createFolder({ payload }) {
    const { path, name } = payload;
    if (!path || !name) {
        console.warn('Invalid arguments - saga: FS, method: createFolder.');
        return;
    }
    try {
        // call main service that will create a new folder
        const newPath = yield call(services.mainIpc.call, 'FileService', 'createFolder', [ path, name ]);
        // refresh File Explorer tree to show a new folder under its parent folder
        yield put(fsActions.treeLoadNodeChildren(path, true));
        // report success
        yield put(fsActions._createFolder_Success(path, name, newPath));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._createFolder_Failure(path, name, err));
    }
}

export function* createFile({ payload }) {
    const { path, name } = payload;
    if (!path || !name) {
        console.warn('Invalid arguments - saga: FS, method: createFile.');
        return;
    }
    try {
        // call main service that will create a new file
        const newPath = yield call(services.mainIpc.call, 'FileService', 'createFile', [ path, name ]);
        // refresh File Explorer tree to show a new file under its parent folder
        yield put(fsActions.treeLoadNodeChildren(path, true));
        // report success
        yield put(fsActions._createFile_Success(path, name, newPath));
    }
    catch (err) {
        /* istanbul ignore next */
        yield put(fsActions._createFile_Failure(path, name, err));
    }
}
