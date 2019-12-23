/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, put, select, takeLatest, call } from 'redux-saga/effects';
import { default as pathNode } from 'path';
import ActionTypes from '../types';
import * as fsActions from './actions';
import * as settingsActions from './../settings/actions';
import * as objRepActions from '../obj-repo/actions';
import * as workbenchActions from './../workbench/actions';
import { reportError } from '../sentry/actions';
import { success, failure } from '../../helpers/redux';
import { putAndTake } from '../../helpers/saga';
import fileSubjects from '../../store/fs/subjects';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import * as tabActions from '../tabs/actions';
import * as editorActions from '../editor/actions';
import ServicesSingleton from '../../services';
const services = ServicesSingleton();
import pathLib from 'path';

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
        takeLatest(ActionTypes.FS_MOVE, move),
        takeLatest(ActionTypes.FS_DELETE, deleteFileOrFolder),
        takeLatest(ActionTypes.FS_SAVE_FILE, saveFileContent),
        takeLatest(ActionTypes.FS_SAVE_FILE_AS, saveFileContentAs),
        takeLatest(ActionTypes.WB_INIT_SUCCESS, initializeSuccess),
        takeLatest(ActionTypes.FS_TREE_OPEN_FOLDER, treeOpenFolder),
        takeLatest(ActionTypes.FS_TREE_LOAD_NODE_CHILDREN, treeLoadNodeChildren),
        takeLatest(ActionTypes.FS_TREE_LOAD_NODE_CHILDREN_SUCCESS, maybeNeedAddWatcherToFolder),
        takeLatest(ActionTypes.FS_TREE_UN_WATCH_FOLDER, maybeNeedRemoveWatcherToFolder),
        takeLatest(ActionTypes.FS_TREE_WATCH_FOLDER, addFolderToWatchers),
        takeLatest('FROM_CACHE', fromCache),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents)
    ]);
}

export function* maybeNeedAddWatcherToFolder({ payload }){
    const fs = yield select(state => state.fs);
    const { rootPath } = fs;

    if(rootPath && payload && payload.path && rootPath !== payload.path){      
        yield call(services.mainIpc.call, 'FileService', 'addFolderToWatchers', [payload.path]);
    }
}

export function* addFolderToWatchers({ payload }){
    if(payload && payload.path){
        yield call(services.mainIpc.call, 'FileService', 'addFolderToWatchers', [payload.path]);
    }
}

export function* maybeNeedRemoveWatcherToFolder({ payload }){
    const { path } = payload;

    if(path){
        yield call(services.mainIpc.call, 'FileService', 'removeFolderToWatchers', [path]);
    }
}

export function* handleServiceEvents({ payload }) {
    const {
        service,
        event,
        type,
        data,
        path,
        content
    } = payload;
    if (!event) {
        return;
    }

    if (service === 'FileService' && event === 'filesWatcher') {
        if (['dirAdd', 'fileAdd'].includes(type)) {
            yield addFileOrFolder(data);
        }
        if (type === 'fileUnlink') {
            yield unlinkFile(path);
        }
        if(type === 'dirUnlink'){
            yield unlinkFile(path);
        }
        if (type === 'fileChangeContent') {
            const activeNode = yield select(state => state.fs.tree.activeNode);
            if (activeNode && path && activeNode === path) {                    
                const localPayload = { path };
                yield fetchFileContent({ payload: localPayload });
            }
        }
    }

    if (service === 'FileService' && event === 'getFileContent' ) {
        if(path){
            const file = yield select(state => state.fs.files[path]);
            if(file && typeof file.modified !== 'undefined'){
                //file exist in edit
                if(file.modified){
                    // looks like file modefied in oxygen-ide 
                    // and now modefied outside oxygen-ide
                    // file modefied, but not saved

                    if(content !== file.content){
                        const ansver = yield call(
                            services.mainIpc.call,
                            'ElectronService',
                            'showConfirmFileChangeBox',
                            [
                                'Oxygen-ide',
                                'Fike has changed on disk. Do yo want to reload it?',
                                ['Cancel', 'Reload']
                            ]
                        );
                        if(typeof ansver !== 'undefined'){
                            if(ansver === 1){
                                // 1 - Reload
                                yield put(fsActions._fetchFileContent_Success(path, content));
                            }
    
                            if(ansver === 0){
                                // 0 - Cancel
                                // do nothing
                            }
                        }
                    } else {
                        // do nothing 
                    }
                } else {
                    // looks like file already added
                    // file not modefied, we can refresh it
                    yield put(fsActions._fetchFileContent_Success(path, content));
                }
            } else {
                // looks like add file first
                // safe operation, because file not modefied yet 
                yield put(fsActions._fetchFileContent_Success(path, content));
            }
        } else {
            console.warn('on getFileContent no path');
        }
    }

    if (service === 'FileService' && event === 'ObjectRepoWatcher' ) {
        if(path && content){
            const [...cont] = content.split('{');
            
            cont.shift();

            const conte = '{'+cont.join('{');
    
            const conten = conte.split('};')[0] + '}';
    
            const repoRoot = JSON.parse(conten);

            const activeNode = yield select(state => state.objrepo.path);
            
            if (activeNode && path && activeNode === path) {
                yield put(objRepActions.openFile(path, true, repoRoot));
            } else {
                console.warn(`${activeNode} === ${path}`);
            }
        }
    }

}

function* addFileOrFolder(fileOrFolder) {
    if (fileOrFolder) {
        yield put(fsActions.addFileOrFolder(fileOrFolder));
    }
}


function* unlinkFile(path) {    
    if (path) {
        const filesState = yield select(state => state.fs.files);
        const editorState = yield select(state => state.editor);

        if(editorState && editorState.openFiles && editorState.openFiles[path]){
            let unlinkedFileContent = '';
            const pathSplit = path.split(pathLib.sep);
            
            const newName = pathSplit[pathSplit.length - 1]+'(deleted from disk)';

            if(filesState && filesState[path] && filesState[path]['content']){
                unlinkedFileContent = filesState[path]['content'];
            }

            yield put(settingsActions.addFile('unknown',newName, unlinkedFileContent));
        }

        yield put(fsActions._delete_Success(path, true));

    }
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
    try {
        yield _fetchFolderContent(path, false);
    }
    catch (e) {
        yield put(fsActions._treeOpenFolder_Failure(path, e.message));
        return;    
    }
    const folder = yield select(state => state.fs.files[path]);  
    yield put(fsActions._treeOpenFolder_Success(path, folder.children));

    const rootPath = yield select(state => state.fs.rootPath); 

    if(rootPath === path){
        //root dir
        yield watchOnFiles(path);
    }  else {
        //nor root dir
        yield watchOnSubFiles(path);
    }
}

export function* fromCache({ payload }) {
    const { cache } = payload;
    const { fs } = cache;
    const { rootPath } = fs;
    if(rootPath){
        yield call(services.mainIpc.call, 'FileService', 'createWatchOnFilesChannel', [rootPath]);
    }
    yield put(workbenchActions._restoreFromCache_Success());
}

export function* watchOnSubFiles(path){
    yield call(services.mainIpc.call, 'FileService', 'addFolderToWatchers', [path]);
}

export function* watchOnFiles(path) {
    yield call(services.mainIpc.call, 'FileService', 'createWatchOnFilesChannel', [path]);
}

export function* initializeSuccess() {
    const filesState = yield select(state => state.fs);
    let path;

    if(filesState && filesState.rootPath){
        path = filesState.rootPath;

        try {
            yield _fetchFolderContent(path);
        }
        catch (e) {
            yield put(fsActions._treeOpenFolder_Failure(path, e.message));
            return;    
        }

        const fs = yield select(state => state.fs);  
        
        if(
            fs &&
            fs.files && 
            fs.files[path]
        ) {
            const folder = fs.files[path];
            const rootPath = fs.rootPath;

            if(folder && folder.children){
                yield put(fsActions._treeOpenFolder_Success(path, folder.children));

                const allFiles = folder.children;

                const editorState = yield select(state => state.editor);
                
                if(editorState && editorState.openFiles && rootPath){
                    
                    const fileContentArray = [];

                    let allResults = yield all(Object.keys(editorState.openFiles).map(openFilePath => {

                        if(!openFilePath.startsWith('unknown') && openFilePath.startsWith(rootPath) && openFilePath.split(rootPath) && openFilePath.split(rootPath)[1]){

                            const innerPath = openFilePath.split(rootPath)[1];
                            const innerPathArray = innerPath.split('\\');
                            innerPathArray.shift();
                            
                            let result = true;

                            if(innerPathArray && innerPathArray.length === 1){
                                // in root folder

                                result = allFiles.some(file => {
                                    return file.path === openFilePath;
                                });

                            } else {
                                // not in root folder
                                
                                const resp = call(
                                    services.mainIpc.call,
                                    'FileService',
                                    'returnFileContent',
                                    [openFilePath]
                                );

                                fileContentArray.push(resp);
                                
                            }
    
                            if(!result){
                                // file removed from folder, but content in cache;
    
                                if(fs && fs.files && fs.files[openFilePath]){
                                    let unlinkedFileContent = fs.files[openFilePath]['content'] || '';
                                    
                                    const pathSplit = openFilePath.split(pathLib.sep);
                                    
                                    const name = pathSplit[pathSplit.length - 1]+'(deleted from disk)';
                                    
                                    const key = 'unknown';
    
                                    const pRes = all([
                                        put(tabActions.renameTab(openFilePath, key, name)),
                                        put(editorActions.renameFile(openFilePath, name, true)),
                                        put(settingsActions.addFile(key, name, unlinkedFileContent))
                                    ]);
    
                                    return pRes;
                                }
                                
                            } else {
                                const resp = call(
                                    services.mainIpc.call,
                                    'FileService',
                                    'returnFileContent',
                                    [openFilePath]
                                );

                                fileContentArray.push(resp);
                            }
                        }
                    }));

                    try{
                        if(fileContentArray && Array.isArray(fileContentArray) && fileContentArray.length > 0){
                            const filesResults = yield all(fileContentArray);
    
                            filesResults.map(file => {
                                if(
                                    file && 
                                    file.filePath && 
                                    typeof file.content === 'string'
                                ){
                                    // file exist
                                    
                                    const pRes = all([
                                        put(fsActions._fetchFileContent_Success(file.filePath, file.content))
                                    ]);

                                    allResults.push(pRes);
                                } else {
                                    let unlinkedFileContent = fs.files[file.filePath]['content']|| '';
                                    const pathSplit = file.filePath.split(pathLib.sep);
                                    
                                    const name = pathSplit[pathSplit.length - 1]+'(deleted from disk)';
                                    
                                    const key = 'unknown';
    
                                    const pRes = all([
                                        put(tabActions.renameTab(file.filePath, key, name)),
                                        put(editorActions.renameFile(file.filePath, name, true)),
                                        put(settingsActions.addFile(key, name, unlinkedFileContent))
                                    ]);
    
                                    allResults.push(pRes);
                                }
                            });
                        }
                    } catch(e){
                        yield put(reportError(e));
                        console.log('Error when try create deleted from disk file', e);
                    }


                    allResults = allResults.filter(function (el) {
                        return el != null;
                    });

                    if(allResults && Array.isArray(allResults) && allResults.length > 0){
                        yield all(allResults);
                    }
                    
                }
            }
        }
    }
}


export function* _fetchFolderContent(path, addWatcher = true) {
    try {
        let folder = yield call(services.mainIpc.call, 'FileService', 'getFolderContent', [path]);
        yield put({
            type: success(ActionTypes.FS_FETCH_FOLDER_CONTENT),
            payload: { path, response: folder },
        });
        
        if (path && addWatcher) {
            const rootPath = yield select(state => state.fs.rootPath); 

            if(rootPath === path){
                //root dir
                yield watchOnFiles(path);
            }  else {
                //nor root dir
                yield watchOnSubFiles(path);
            }
        }
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
        if(path){
            yield _fetchFolderContent(path);
        }
    } catch (err) {
        console.warn('Problem when fetching folder content whith payload:', payload);
    }
}

export function* fetchFileContent({ payload }) {
    if (payload && payload.path) {
        const { path } = payload;
        try {
            const file = yield select(state => state.fs.files[path]);
            if (!file) {
                yield putAndTake(fsActions.fetchFileInfo(path));
            }
            yield call(
                services.mainIpc.call,
                'FileService',
                'getFileContent',
                [path]
            );
        } catch (err) {
            /* istanbul ignore next */
            yield put(fsActions._fetchFileContent_Failure(path, err));
        }
    } else {
        yield put(fsActions._fetchFileContent_Failure('', 'No file path in payload'));
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
        if(path){
            const file = yield select(state => state.fs.files[path]);
            if (!file) {
                return;
            }
            let content = '';
            if(file && file.content){
                content = file.content;
            }
            yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  content]);
            yield put(fsActions._saveFile_Success(path));
        }
    }
    catch (err) {
        yield put(reportError(err));

        let saveCode = 'Unknown code';
        if(err && err.code){
            saveCode = err.code;
        }

        yield call(services.mainIpc.call, 'ElectronService', 'showErrorBox', ['Save File Failed', saveCode]);
        yield put(fsActions._saveFile_Failure(path, err));
    }
}

export function* saveFileContentAs({ payload }) {
    const { path, content } = payload;
    try {
        if (!path || typeof content === 'undefined') {
            console.warn('Invalid arguments - saga: FS, method: saveFileContentAs.');
            return;
        }
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  content]);
        const { response } = yield putAndTake(fsActions.fetchFileInfo(path));
        yield put(fsActions._saveFileAs_Success(path, content, response));
    }
    catch (err) {
        yield put(reportError(err));
        yield put(fsActions._saveFileAs_Failure(path, err));
    }
}

export function* move({ payload }){
    const { oldPath, newPath } = payload;
    if (!oldPath || !newPath) {
        console.warn('Invalid arguments - saga: FS, method: move');
        return;
    } else {
        yield call(services.mainIpc.call, 'FileService', 'move', [oldPath, newPath]);
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
        yield fileSubjects['FILE.RENAMED'].next({ oldPath: path, newPath: fileInfo.path });
        // refresh File Explorer tree since we need to sort again
        yield put(fsActions.treeLoadNodeChildren(pathNode.dirname(path), true));
        // report success
        yield put(fsActions._rename_Success(path, fileInfo));
    }
    catch (err) {
        yield put(reportError(err));
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
        yield put(reportError(err));
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
        yield call(services.mainIpc.call, 'FileService', 'createFolder', [ path, name ]);

        // // refresh File Explorer tree to show a new folder under its parent folder
        // yield put(fsActions.treeLoadNodeChildren(path, true));
        // // report success
        // yield put(fsActions._createFolder_Success(path, name, newPath));
    }
    catch (err) {
        yield put(reportError(err));
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
        yield put(reportError(err));
        yield put(fsActions._createFile_Failure(path, name, err));
    }
}
