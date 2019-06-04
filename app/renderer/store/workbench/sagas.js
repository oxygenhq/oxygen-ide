/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import uuidv4 from'uuid/v4';
import { all, put, select, takeLatest, take, call, fork } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';
import pathHelper from 'path';

import SupportedExtensions from '../../helpers/file-extensions';
import * as Const from '../../../const';
import * as Menus from '../../../config/menus';

/* Action Creators */
import * as fsActions from '../fs/actions';
import * as tabActions from '../tabs/actions';
import * as editorActions from '../editor/actions';
import * as wbActions from './actions';
import * as testActions from '../test/actions';
import * as dialogActions from '../dialog/actions';
import * as recorderActions from '../recorder/actions';
import * as settingsActions from '../settings/actions';

import { success, failure, successOrFailure } from '../../helpers/redux';

import ActionTypes from '../types';
import { MAIN_MENU_EVENT, MAIN_SERVICE_EVENT } from '../../services/MainIpc';
import { JAVA_ERROR_INFO, JAVA_NOT_FOUND, JAVA_BAD_VERSION } from '../../services/JavaService';

import ServicesSingleton from '../../services';
import editorSubjects from '../editor/subjects';

import pathLib from 'path';

const services = ServicesSingleton();
/**
 * Workbench Sagas
 */
export default function* root() {
    yield all([
      takeLatest(ActionTypes.WB_OPEN_FOLDER, openFolder),
      takeLatest(ActionTypes.WB_INIT, initialize),
      takeLatest(ActionTypes.WB_DEACTIVATE, deactivate),
      takeLatest(ActionTypes.WB_OPEN_FILE, openFile),
      takeLatest(ActionTypes.WB_OPEN_FAKE_FILE, openFakeFile),
      takeLatest(ActionTypes.WB_CREATE_NEW_REAL_FILE, createNewRealFile),
      takeLatest(ActionTypes.WB_SHOW_DIALOG, showDialog),
      takeLatest(ActionTypes.WB_HIDE_DIALOG, hideDialog),
      takeLatest(ActionTypes.WB_CLOSE_FILE, closeFile),
      takeLatest(ActionTypes.WB_CLOSE_ALL_FILES, closeAllFiles),
      takeLatest(ActionTypes.WB_RENAME_FILE, renameFile),
      takeLatest(ActionTypes.WB_SHOW_NEW_FILE_DIALOG, showNewFileDialog),
      takeLatest(ActionTypes.WB_CREATE_FILE, createFile),
      takeLatest(ActionTypes.WB_CREATE_FOLDER, createFolder),
      takeLatest(ActionTypes.WB_DELETE_FILE, deleteFile),
      takeLatest(ActionTypes.WB_SAVE_CURRENT_FILE, saveCurrentFile),   
      takeLatest(ActionTypes.WB_START_RECORDER, startRecorder),         
      takeLatest(ActionTypes.WB_STOP_RECORDER, stopRecorder),
      takeLatest(ActionTypes.WB_RECORDER_START_WATCHER, startRecorderWatcher),
      takeLatest(ActionTypes.WB_SHOW_CONTEXT_MENU, showContextMenu),      
      takeLatest(ActionTypes.WB_ON_TAB_CHANGE, changeTab),
      takeLatest(ActionTypes.WB_ON_CONTENT_UPDATE, contentUpdate),      
      takeLatest(success(ActionTypes.FS_RENAME), handleFileRename),
      takeLatest(success(ActionTypes.FS_DELETE), handleFileDelete),
      takeLatest(MAIN_MENU_EVENT, handleMainMenuEvents),
      takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
      takeLatest(JAVA_ERROR_INFO, handleJavaError),
      takeLatest(JAVA_NOT_FOUND, handleJavaNotFound),
      takeLatest(JAVA_BAD_VERSION, handleJavaBadVersion),
    ]);
}

export function* handleMainMenuEvents({ payload }) { 
    const { cmd, args } = payload;
    if (!cmd) {
        return;
    }
    if (cmd === Const.MENU_CMD_SAVE) {
        yield put(wbActions.saveCurrentFile());
    }
    else if (cmd === Const.MENU_CMD_SAVE_AS) {
        yield put(wbActions.saveCurrentFile(true));
    }
    else if (cmd === Const.MENU_CMD_UNDO) {
        yield editorSubjects["EDITOR.TRIGGER"].next({ trigger: 'undo' });
    }
    else if (cmd === Const.MENU_CMD_REDO) {
        yield editorSubjects["EDITOR.TRIGGER"].next({ trigger: 'redo' });
    }
    else if (cmd === Const.MENU_CMD_SELECT_ALL) {
        yield editorSubjects["EDITOR.TRIGGER"].next({ trigger: 'selectall' });
    }
    else if (cmd === Const.MENU_CMD_FIND) {
        yield editorSubjects["EDITOR.TRIGGER"].next({ trigger: 'find' });
    }
    else if (cmd === Const.MENU_CMD_REPLACE) {
        yield editorSubjects["EDITOR.TRIGGER"].next({ trigger: 'replace' });
    }
    else if (cmd === Const.MENU_CMD_HELP_CHECK_UPDATES) {
        yield services.mainIpc.call('UpdateService', 'start', [true]).then(() => {});
    }
    else if (cmd === Const.MENU_CMD_CLEAR_ALL) {
        const clearRsult = yield services.mainIpc.call('ElectronService', 'clearSettings');
        const closeWatcherIfExistRsult = yield services.mainIpc.call('FileService', 'closeWatcherIfExist');
        yield clearAll();
        yield initialize();
    }
    else if (cmd === Const.MENU_CMD_OPEN_FOLDER) {
        yield put(wbActions.showDialog('OPEN_FOLDER'));
    }
    else if (cmd === Const.MENU_CMD_OPEN_FILE) {
        yield put(wbActions.showDialog('OPEN_FILE'));
    }
    else if (cmd === Const.MENU_CMD_NEW_FILE) {
        yield openFakeFile();
    }
    else if (cmd === Const.MENU_CMD_NEW_FOLDER) {
        yield showNewFolderDialog({});
    }
    else if (cmd === Const.MENU_CMD_RENAME_FILE) {
        yield showRenameFileDialog({});
    }
    else if (cmd === Const.MENU_CMD_RENAME_FOLDER) {
        yield showRenameFolderDialog({});
    }
    else if (cmd === Const.MENU_CMD_DELETE_FOLDER || cmd === Const.MENU_CMD_DELETE_FILE) {
        yield showDeleteFileDialog({});
    }
    else if (cmd === Const.MENU_CMD_VIEW_EVENT_LOG) {
        if (args && args.length > 0 && typeof args[0] === 'boolean') {
            yield put(settingsActions.setLoggerVisible(args[0]));
        }        
    }
    else if (cmd === Const.MENU_CMD_VIEW_SETTINGS) {
        yield put(wbActions.showDialog('DIALOG_SETTINGS'));
    }
}

export function* handleServiceEvents({ payload }) {
    const { service, event } = payload;
    if (!event) {
        return;
    }
    if (service === 'UpdateService') {
        yield handleUpdateServiceEvent(event);
    }
}

export function* handleJavaError({ payload }){
    if(payload.err){
        yield put(wbActions.setJavaError(payload.err));
    } else {
        yield put(wbActions.setJavaError());
    }
}

export function* handleJavaNotFound(inner){
    if(payload.message){
        yield put(wbActions.setJavaError({
            reason: 'not-found',
            message: payload.message
        }));
    } else {
        yield put(wbActions.setJavaError());
    }
}

export function* handleJavaBadVersion({ payload }){

    const { message, version } = payload;

    if(payload.message){
        if(version){
            const versionInt = parseInt(version);

            if(versionInt < 8 || versionInt > 10){
                yield put(wbActions.setJavaError({
                    reason: 'bad-version',
                    message: message
                }));
            } else {
                // ignore, version is correct
                return;
            }
        }
    } else {
        yield put(wbActions.setJavaError());
    }
    return;
}

function* handleUpdateServiceEvent(event) {
    if (event.type === 'UPDATE_CHECK') {
        yield put(wbActions.showDialog('DIALOG_UPDATE', { version: event.version, url: event.url }));
    }
}

export function* clearAll() {
    yield put(wbActions.reset());
}

export function* deactivate() {
    // stop Selenium server
    let SeleniumServiceStopResult = yield call(services.mainIpc.call, 'SeleniumService', 'stop');
    console.log('SeleniumServiceStopResult', SeleniumServiceStopResult);
}

export function* initialize() {

    // start check for update
    services.mainIpc.call('UpdateService', 'start').then(() => {});
    // start Selenium server
    services.mainIpc.call('SeleniumService', 'start').then(() => {});
    // start Android and iOS device watcher
    services.mainIpc.call('DeviceDiscoveryService', 'start').then(() => {});

    /* sync variant

    let UpdateServiceStartResult = yield call(services.mainIpc.call, 'UpdateService', 'start');
    console.log('UpdateServiceStartResult', UpdateServiceStartResult);

    // start Selenium server
    let SeleniumServiceStartResult = yield call(services.mainIpc.call, 'SeleniumService', 'start');
    console.log('SeleniumServiceStartResult', SeleniumServiceStartResult);

    // start Android and iOS device watcher
    let DeviceDiscoveryServiceStartResult = yield call(services.mainIpc.call, 'DeviceDiscoveryService', 'start');
    console.log('DeviceDiscoveryServiceStartResult', DeviceDiscoveryServiceStartResult);

    */

    // get app settings from the store
    let appSettings = yield call(services.mainIpc.call, 'ElectronService', 'getSettings');

    console.log('appSettings', appSettings);

    if(appSettings && appSettings.cache){
        yield put(wbActions.restoreFromCache(appSettings.cache));

        if(appSettings.cache.settings && appSettings.cache.settings.uuid){
            yield call(services.mainIpc.call, 'AnalyticsService', 'setUser', [appSettings.cache.settings.uuid]);
        } else {
            const uuid = uuidv4();
            yield call(services.mainIpc.call, 'AnalyticsService', 'createUser', [uuid]);
            yield put(settingsActions.createUser(uuid));
        }

    } else {
        yield put(settingsActions.changeCacheUsed(true));

        const uuid = uuidv4();

        yield call(services.mainIpc.call, 'AnalyticsService', 'createUser', [uuid]);
        yield put(settingsActions.createUser(uuid));
        yield put(settingsActions.firstOpen());
        if(appSettings){
            appSettings.cacheUsed = true;
        }
    }

    if (appSettings) {

        if(appSettings.showRecorderMessage === null ){
            // set showRecorderMessage from cache
            if(appSettings.cache && appSettings.cache.settings && typeof appSettings.cache.settings.showRecorderMessage === "boolean"){
                appSettings.showRecorderMessage = appSettings.cache.settings.showRecorderMessage
            }
        }

        // make sure we push Electron store settings to our Redux Store
        yield put(settingsActions.mergeSettings(appSettings));
    }

    if(appSettings && appSettings.lastSession && appSettings.lastSession.rootFolder){
        yield put(settingsActions.hildeLanding());
    } else {
        yield put(settingsActions.showLanding());
    }
    // retrieve and save merged settings back to Electron store
    const allSettings = yield select(state => state.settings);
    yield call(services.mainIpc.call, 'ElectronService', 'updateSettings', [allSettings]);
    // // if a folder was open in the last session, load this folder in File Explorer 
    // if (allSettings && allSettings.lastSession && allSettings.lastSession.rootFolder) {
    //     const { error } = yield putAndTake(
    //         wbActions.openFolder(allSettings.lastSession.rootFolder)
    //     );
    //     // ignore any errors
    // }
    // // if last session includes previously open tabs, reopen tabs for files which still exist 
    // if (allSettings && allSettings.lastSession && allSettings.lastSession.tabs) {
    //     for (let tab of allSettings.lastSession.tabs) {            
    //         yield put(tabActions.addTab(tab.key, tab.title));
    //         const { error } = yield putAndTake(
    //             editorActions.openFile(tab.key)
    //         );
    //         // if any error occurs during openning tab's file content (e.g. file doesn't not exist), remove this tab
    //         if (error) {
    //             console.log('error', error);
    //             if(tab && tab.key){
    //                 yield put(tabActions.removeTab(tab.key));
    //             }
    //         }
    //         else {                
    //             yield put(testActions.setMainFile(tab.key));
    //         }
    //     }
    // }
    // indicate successful end of initialization process
    
    yield put({
        type: success(ActionTypes.WB_INIT),
    });
}

export function* openFolder({ payload }) {
    const { path } = payload;
    // check if there are any unsaved files - if so, prompt user and ask whether to proceed.
    const files = yield select(state => state.fs.files);
    const unsaved = getUnsavedFiles(files);
    
    if (unsaved && unsaved.length > 0) {
        let fileNamesStr = '';
        
        unsaved.map((file) => {
            if(file && file.name && typeof file.name){
                if(fileNamesStr){
                    fileNamesStr+= ', '+file.name;
                } else {
                    fileNamesStr+= file.name;
                }
            }
        });

        if (!confirm(`There are ${unsaved.length} unsaved files : ${fileNamesStr}. Are you sure you want to proceed and lose unsaved changes?`)) {
            return;
        }
    }
    // close all open files in the Editor
    yield put(wbActions.closeAllFiles(true));
    // clear all files from FS cache (just to free up some memory)
    yield put(fsActions.clearAllFiles());
    // clear File Explorer tree
    yield put(fsActions.clearTree());
    // then call File Explorer's treeOpenFolder method
    const { error } = yield putAndTake(
        fsActions.treeOpenFolder(path)
    );
    if (error) {
        yield put(wbActions._openFile_Failure(path, error));
        return;
    }
    // store new root folder in the App Settings
    yield put(settingsActions.setLastSessionRootFolder(path));
    const settings = yield select(state => state.settings);
    // persiste settings in the Electron store
    yield call(services.mainIpc.call, 'ElectronService', 'updateSettings', [settings]);
    // report success
    yield put(wbActions._openFile_Success(path));
}

export function* changeTab({ payload }) {
    const { key, name } = payload;

    // console.log('key', key);
    // console.log('name', name);

    if(key === "unknown"){
        yield put(tabActions.setActiveTab(key, name));
        yield put(testActions.setMainFile(key, name));
        yield put(editorActions.setActiveFile(key, name));
    } else {
        const { error } = yield putAndTake(
            editorActions.openFile(key, true)
        );
        // if any error occurs during openning tab's file content (e.g. file doesn't not exist), remove this tab
        if (error) {
            console.log('error', error);
            if(key){
                yield put(tabActions.removeTab(key));
            }
        }
        else {
            yield put(tabActions.setActiveTab(key));
            yield put(testActions.setMainFile(key));
        }
    }
}

export function* createNewRealFile({ payload }){
    console.log('createNewRealFile', payload);
    
    const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [null, null, [ 
        { name: 'JavaScript file', extensions:['js'] },
        { name: 'All Files', extensions: ['*'] } 
    ]]);
    
    console.log('saveAsPath', saveAsPath);

    if (!saveAsPath) {
        return; // Save As dialog was canceled by user
    }
    
    // C:\projects\cb-webui\WebAPI\aaz.js => C:\projects\cb-webui\WebAPI\
    let folderPath = saveAsPath.split("\\");
    folderPath.pop();
    folderPath = folderPath.join("\\");
    console.log('folderPath', folderPath);

    let content = '';
    
    if(payload && payload.fakeFile){
        content= payload.fakeFile.content;
    }

    let saveContent = content;

    if(!content){
        saveContent = '';
    }

    const { error } = yield putAndTake(
        fsActions.saveFileAs(saveAsPath, saveContent)
    );

    if (!error) {            
        // re-retrieve all files, as Saved As file info has been just added to the File Cache.
        const updatedFiles = yield select(state => state.fs.files);
        // retrieve file info for the newly saved file
        const saveAsFile = updatedFiles[saveAsPath];

        if (!saveAsFile) {
            return;     // not suppose to happen
        }


        if(payload && payload.fakeFile){

            const { path, name } = payload.fakeFile;

            const files = yield select(state => state.settings.files);

            console.log('files', files);

            const currentFile = files[path+name];

            console.log('currentFile', currentFile);

            if(currentFile){
                yield closeTmpFile(currentFile);
            }
        }

        const fs = yield select(state => state.fs);
        
        console.log('fs', fs);
        
        if(fs && typeof typeof fs.rootPath !== 'undefined' && fs.rootPath === null){
            const { error } = yield putAndTake(
                fsActions.treeOpenFolder(folderPath)
            );

            if (error) {
                console.log('error')

                yield put(wbActions._openFile_Failure(folderPath, error));
                return;
            }   

            // report success
            yield put(wbActions._openFile_Success(folderPath));
        } else {
            console.log('rootPath is good');
        }

        // refresh File Explorer tree in case save file's parent folder is currently open in the tree
        yield fsActions.treeLoadNodeChildren(saveAsFile.parentPath, true);
        // open newly saved file (as it's not necessary open) - e.g. open it in a new tab
        yield openFile({ payload: { path: saveAsPath } });
        yield put(testActions.startTest());

    }
}

const getMaxIndex = (tabs) => {
    let index = 0;

    if(Array.isArray(tabs)){
        tabs.map(tab => {
            if(tab && tab.title && tab.key && tab.key === "unknown"){
                const number = parseInt(tab.title.replace( /^\D+/g, ''));

                if(isNaN(number)){
                    // ignore
                } else {
                    if(number > index){
                        index = number;
                    }
                }
            }
        })
    }

    return index;
}

export function* openFakeFile(){
    let tabs = yield select(state => state.tabs);
    let idenity;

    // console.log('tabs', tabs);

    if(tabs && tabs.list && Array.isArray(tabs.list)){
        idenity = tabs.list.filter((tab) => tab.key === "unknown");
        if(!idenity){
            idenity = [];
        }
    } else {
        idenity = [];
    }

    // console.log('idenity', idenity);
    

    const key = "unknown";
    let name = "Untitled-"+(idenity.length+1);

    
    const tmpFileExist = tabs.list.some((tab) => tab.key === key && tab.title === name );

    // console.log('tmpFileExist', tmpFileExist);
    if(tmpFileExist){
        // console.log('in if');
        const index = getMaxIndex(tabs.list);
        // console.log('tabs.list', tabs.list);
        // console.log('index', index);
        if(index === 0){
            const timestamp = + new Date();
            name = "Untitled-"+(timestamp);
        } else {
            name = "Untitled-"+(index+1);
        }
    }

    yield put(tabActions.addTab(key, name));
    yield put(tabActions.setActiveTab(key, name));
    yield put(editorActions.setActiveFile(key, name));
    yield put(editorActions.addFile(key, name));
    yield put(settingsActions.addFile(key,name));
    yield put(wbActions._openFakeFile_Success(key,name));
}

export function* openFile({ payload }) {
    const { path } = payload;
    let file = yield select(state => state.fs.files[path]);
    if (!file) {
        const { error } = yield putAndTake(
            fsActions.fetchFileInfo(path)
        );
        if (error) {
            yield put(wbActions._openFile_Failure(path, error));
            return;
        }
        file = yield select(state => state.fs.files[path]);
    }
    // check if we support file's extension
    if (!SupportedExtensions[file.ext]) {
        // show error
        yield put(wbActions._openFile_Failure(path, { message: 'File type is not supported.' }));
        return;
    }
    // add new tab or make the existing one active
    yield put(tabActions.addTab(path, file.name));
    yield put(tabActions.setActiveTab(path));
    // open a new editor or make an existing editor active
    const { error } = yield putAndTake(
        editorActions.openFile(path)
    );
    // if any error occurs during openning tab's file content (e.g. file doesn't not exist), remove this tab
    if (error) {
        yield put(tabActions.removeTab(path));
        yield put(wbActions._openFile_Failure(path, error));
    }
    else {
        yield put(testActions.setMainFile(path));
        yield put(wbActions._openFile_Success(path));
    }
}

export function* renameFile({ payload }) {
    const { path, newName } = payload;
    yield put(fsActions.rename(path, newName));
}

export function* createFile({ payload }) {
    const { path, name } = payload;
    const { error } = yield putAndTake(
        fsActions.createFile(path, name)
    );
    if (error) {
        yield put(wbActions._createFile_Failure(path, name, error));
    }
    else {
        //yield put(fsActions.treeLoadNodeChildren())
        yield put(wbActions._createFile_Success(path, name));
        yield put(wbActions.openFile(path+pathHelper.sep+name));
    }
}

export function* createFolder({ payload }) {
    const { path, name } = payload;
    const { error } = yield putAndTake(
        fsActions.createFolder(path, name)
    );
    if (error) {
        yield put(wbActions._createFolder_Failure(path, name, error));
    }
    else {
        yield put(wbActions._createFolder_Success(path, name));
    }
}

export function* deleteFile({ payload }) {
    const { path } = payload;
    if (!path) {
        console.warn('Invalid arguments - saga: Workbench, method: deleteFile.');
        return;
    }
    yield put(fsActions.deleteFile(path));
}

export function* closeFile({ payload }) {
    const filesState = yield select(state => state.fs.files);
    const editorState = yield select(state => state.editor);
    const tabsState = yield select(state => state.tabs);

    const { path, force = false, name = null, showDeleteTitle = false } = payload;
    const file = yield select(state => state.fs.files[path]);
    // prompt user if file has been modified and unsaved
    if (file && force == false && file.modified && file.modified == true) {
        if (!confirm(`Are you sure you want to close unsaved file ${file.name}?`)) {
            return;
        }
    }

    if(showDeleteTitle && path){
        const pathSplit = path.split(pathLib.sep);

        if(pathSplit && pathSplit.length){
            const newName = pathSplit[pathSplit.length - 1]+'(deleted from disk)';
            
            yield put(tabActions.renameTab(path, 'unknown', newName));
            yield put(editorActions.renameFile(path, newName, true));
            return;
        } else {
            yield put(tabActions.removeTab(path, name));
            yield put(editorActions.closeFile(path, false, name));
            yield put(fsActions.resetFileContent(path));
        }
    } else {
        yield put(tabActions.removeTab(path, name));
        yield put(editorActions.closeFile(path, false, name));
        yield put(fsActions.resetFileContent(path));
    }

    yield put(testActions.removeBreakpoints(path));
    // retrieve new active tab, if there are more files open
    const activeTab = yield select(state => state.tabs.active);
    // make sure to update main test file, when current tab is closed
    // set main file to a new active tab, if any tab is still open
    if (activeTab) {
        yield put(testActions.setMainFile(activeTab));
    }
    // or set main test file to null if no tab is open
    else {
        yield put(testActions.setMainFile(null));
    }

    if(path === "unknown"){

       yield put(settingsActions.removeFile(path, name));
    }

    yield put(wbActions._closeFile_Success(path, name));
}

export function* closeAllFiles({ payload }) {
    const { force = false } = payload;
    const openFiles = yield select(state => state.editor.openFiles);
    if (!openFiles || Object.keys(openFiles).length == 0) {
        return;     // no open files in editor to close
    }
    for (let filePath of Object.keys(openFiles)) {
        yield putAndTake(wbActions.closeFile(filePath, force));
    }
}

export function* showDialog({ payload }) {
    const { dialog, params } = payload || {};
    // show system dialog - OPEN_FOLDER
    if (dialog === 'OPEN_FOLDER') {
        const paths = yield call(services.mainIpc.call, 'ElectronService', 'showOpenFolderDialog', []);

        if (paths && Array.isArray(paths) && paths.length > 0) {

            const path = paths[0];
            const splitResult = path.split('\\');

            if(splitResult && splitResult.length === 2 && !splitResult[1]){
                alert('Sorry, we don\'t support open full disc, please select some folder');
            } else {
                yield openFolder({ payload: { path: paths[0] }});
            }
        }
    }
    else if (dialog === 'OPEN_FILE') {
        const paths = yield call(services.mainIpc.call, 'ElectronService', 'showOpenFileDialog', []);
        if (paths && Array.isArray(paths) && paths.length > 0) {
            for (let path of paths) {
                yield put(wbActions.openFile(path));
            }            
        }
    }
    else {
        yield put(dialogActions.showDialog(dialog, params));
    }
}

export function* hideDialog({ payload }) {
    const { dialog } = payload || {};
    yield put(dialogActions.hideDialog(dialog));
}

export function* contentUpdate({ payload }) {
    const { path, content, name } = payload;
    let tabsList = yield select(state => state.tabs.list);

    const tab = tabsList.find(x => x.key === path && x.title === name);
    
    // if tab is untouched (e.g. original content has not been updated), then mark the tab as touched
    if (tab && (!tab.touched || tab.touched == false)) {
        yield put(tabActions.setTabTouched(path, true, name));
    }    

    if(path === "unknown"){
        yield put(settingsActions.updateFileContent(path, content, name));
    } else {
        yield put(fsActions.updateFileContent(path, content));
    }
}

export function* closeTmpFile(file){
    console.log('file', file);

    yield put(editorActions.closeFile(file.path, false, file.name));
    yield put(tabActions.removeTab(file.path, file.name));
    yield put(settingsActions.removeFile(file.path, file.name));
}

export function* saveCurrentFile({ payload }) {
    const { prompt } = payload || {};
    const editor = yield select(state => state.editor);
    const recorder = yield select(state => state.recorder);

    const { activeFile, activeFileName } = editor;


    if(activeFile === "unknown"){
        const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [activeFileName, null, [ 
            { name: 'JavaScript file', extensions:['js'] },
            { name: 'All Files', extensions: ['*'] } 
        ] ]);
    
        if (!saveAsPath) {
            return; // Save As dialog was canceled by user
        }

        let folderPath;

        if (process.platform === 'win32') {
            // C:\projects\cb-webui\WebAPI\aaz.js => C:\projects\cb-webui\WebAPI\
            folderPath = saveAsPath.split("\\");
            folderPath.pop();
            folderPath = folderPath.join("\\");
        } else {
            // /Users/developer/Downloads/f.js => /Users/developer/Downloads
            folderPath = saveAsPath.split("/");
            folderPath.pop();
            folderPath = folderPath.join("/");
        }

        const files = yield select(state => state.settings.files);
        
        const currentFile = files[activeFile+activeFileName];

        let saveContent = currentFile.content;

        if(!saveContent){
            saveContent = '';
        }

        const { error } = yield putAndTake(
            fsActions.saveFileAs(saveAsPath, saveContent)
        );
        
        if (!error) {            
            // re-retrieve all files, as Saved As file info has been just added to the File Cache.
            const updatedFiles = yield select(state => state.fs.files);
            // retrieve file info for the newly saved file
            const saveAsFile = updatedFiles[saveAsPath];


            if (!saveAsFile) {
                return;     // not suppose to happen
            }
            // refresh File Explorer tree in case save file's parent folder is currently open in the tree
            yield fsActions.treeLoadNodeChildren(saveAsFile.parentPath, true);
            // open newly saved file (as it's not necessary open) - e.g. open it in a new tab

            if(currentFile){
                yield closeTmpFile(currentFile);
            }

            const fs = yield select(state => state.fs);
            
            // console.log('fs', fs);

            if(fs && typeof typeof fs.rootPath !== 'undefined' && fs.rootPath === null){
                const { error } = yield putAndTake(
                    fsActions.treeOpenFolder(folderPath)
                );
    
                if (error) {
                    console.log('error')
    
                    yield put(wbActions._openFile_Failure(folderPath, error));
                    return;
                }   
    
                // report success
                yield put(wbActions._openFile_Success(folderPath));
            } else {
                console.log('rootPath is good');
            }

            yield openFile({ payload: { path: saveAsPath } });

            if(recorder && recorder.activeFile && recorder.activeFileName){
                if(recorder.activeFile === activeFile && recorder.activeFileName === activeFileName){
                    yield put(recorderActions.replaceFileCredentials(saveAsPath, null));
                }
            }
        }
    } else {
        const files = yield select(state => state.fs.files);

        // console.log('files', files);
    
        if (!activeFile || !files.hasOwnProperty(activeFile)) {
            return;
        }

        const currentFile = files[activeFile];

        // console.log('currentFile', currentFile);
        // console.log('prompt', prompt);

        // prompt user with "Save As" dialog before saving the file
        if (prompt) {
            const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [null, activeFile]);
            if (!saveAsPath) {
                return; // Save As dialog was canceled by user
            }

            let saveContent = currentFile.content;

            if(!saveContent){
                saveContent = '';
            }

            const { error } = yield putAndTake(
                fsActions.saveFileAs(saveAsPath, saveContent)
            );
            if (!error) {            
                // re-retrieve all files, as Saved As file info has been just added to the File Cache.
                const updatedFiles = yield select(state => state.fs.files);
                // retrieve file info for the newly saved file
                const saveAsFile = updatedFiles[saveAsPath];
                if (!saveAsFile) {
                    return;     // not suppose to happen
                }
                // refresh File Explorer tree in case save file's parent folder is currently open in the tree
                yield fsActions.treeLoadNodeChildren(saveAsFile.parentPath, true);
                // open newly saved file (as it's not necessary open) - e.g. open it in a new tab
                yield openFile({ payload: { path: saveAsPath } });
            }
        }
        // just save current file without prompting the user
        else if (currentFile.modified || prompt) {
            const { error } = yield putAndTake(
                fsActions.saveFile(activeFile, currentFile.content)
            );
            if (!error) {
                yield put(tabActions.setTabTouched(activeFile, false));
            }
        } else {
            const tabsFiles = yield select(state => state.tabs);

            const { list } = tabsFiles;

            if(list && Array.isArray(list)){
                const tab = list.find(x => x.key === activeFile);

                if(tab && typeof tab.touched !== 'undefined' && tab.touched){
                    const { error } = yield putAndTake(
                        fsActions.saveFile(activeFile, currentFile.content)
                    );
                    if (!error) {
                        yield put(tabActions.setTabTouched(activeFile, false));
                    }
                }
                // console.log('tab', tab);
            }
            
            // console.log('tabsFiles', tabsFiles);

        }
    }
}

export function* handleFileRename({ payload }) {
    const { oldPath, newFile } = payload;
    // check if one of the open tabs is impacted by changed file name
    let tabsList = yield select(state => state.tabs.list);
    const tab = tabsList.find(x => x.key === oldPath);
    if (tab) {
        yield put(tabActions.renameTab(oldPath, newFile.path, newFile.name));
    }
}

export function* handleFileDelete({ payload }) {
    const { path, showDeleteTitle } = payload;
    yield closeFile({ payload: {...payload, force: true} });
}

export function* startRecorder({ payload }) {
    const { error } = yield putAndTake(recorderActions.startRecorder());
    if (error && error.code && error.code === 'NO_ACTIVE_FILE') {
        yield call(services.mainIpc.call, 'ElectronService', 'showErrorBox', ['Test Recorder', 'Please open or create a script file before starting the recorder.']);
    }
}

export function* stopRecorder({ payload }) {
    yield put(recorderActions.stopRecorder());
}

export function* startRecorderWatcher({ payload }) {
    yield put(recorderActions.startRecorderWatcher());
}

export function* showNewFileDialog({ payload }) {
    
    const activeNode = (yield select(state => state.fs.tree.activeNode)) || null;
    const rootPath = (yield select(state => state.fs.rootPath)) || null;
    const files = yield select(state => state.fs.files);
    const treeActiveFile = activeNode && files.hasOwnProperty(activeNode) ? files[activeNode] : null;

    if (treeActiveFile) {
        // in case the file is currently selected in the tree, create a new file in the same directory as the selected file
        if (treeActiveFile.type === 'file') {
            yield put(
                wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'file', path: treeActiveFile.parentPath })
            );
        }
        // otherwise if folder is selected, create a new file inside the selected folder
        else {
            yield put(
                wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'file', path: treeActiveFile.path })
            );
        }
    }
    else if (rootPath) {
        yield put(
            wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'file', path: rootPath })
        );
    }
}

export function* showNewFolderDialog({ payload }) {   
    const activeNode = (yield select(state => state.fs.tree.activeNode)) || null;
    const rootPath = (yield select(state => state.fs.rootPath)) || null;
    const files = yield select(state => state.fs.files);
    const treeActiveFile = activeNode && files.hasOwnProperty(activeNode) ? files[activeNode] : null;

    if (treeActiveFile) {
        // in case the file is currently selected in the tree, create a new file in the same directory as the selected file
        if (treeActiveFile.type === 'file') {
            yield put(
                wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'folder', path: treeActiveFile.parentPath })
            );
        }
        // otherwise if folder is selected, create a new file inside the selected folder
        else {
            yield put(
                wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'folder', path: treeActiveFile.path })
            );
        }
    }
    else if (rootPath) {
        yield put(
            wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'folder', path: rootPath })
        );
    }
}

export function* showRenameFolderDialog({ payload }) { 
    const activeNodePath = (yield select(state => state.fs.tree.activeNode)) || null;
    if (!activeNodePath) {
        return;
    }
    // folder information might not be pre-fetched if the selected folder was not previously expanded in the tree
    // in that case, fetch folder info before proceeding
    const { response, error } = yield getOrFetchFileInfo(activeNodePath);

    if(response){
        const treeActiveFile = response;
        // ignore any file entry which is not folder
        if (!treeActiveFile || treeActiveFile.type !== 'folder') {
            return;
        }
        const { type, path, name } = treeActiveFile;
        yield put(wbActions.showDialog('DIALOG_FILE_RENAME', { type, path, name }));
    }

    if(error && error.message){
        alert(error.message);
        yield put(fsActions.deleteFile(activeNodePath));
    }
}

export function* showRenameFileDialog({ payload }) {   
    const activeNodePath = (yield select(state => state.fs.tree.activeNode)) || null;
    if (!activeNodePath) {
        return;
    }
    // folder information might not be pre-fetched if the selected folder was not previously expanded in the tree
    // in that case, fetch folder info before proceeding
    
    const { response, error } = yield getOrFetchFileInfo(activeNodePath);

    if(response){
        const treeActiveFile = response;

        // ignore any file entry which is not folder
        if (!treeActiveFile || treeActiveFile.type !== 'file') {
            return;
        }
        const { type, path, name } = treeActiveFile;
        yield put(wbActions.showDialog('DIALOG_FILE_RENAME', { type, path, name }));
    }

    if(error && error.message){
        alert(error.message);
        yield put(fsActions.deleteFile(activeNodePath));
    }
}

export function* showDeleteFileDialog({ payload }) {
    // retrieve path of active node in File Explorer
    const activeNodePath = (yield select(state => state.fs.tree.activeNode)) || null;
    if (!activeNodePath) {
        return;
    }
    // folder information might not be pre-fetched if the selected folder was not previously expanded in the tree
    // in that case, fetch folder info before proceeding
    const { response, error } = yield getOrFetchFileInfo(activeNodePath);
    
    if(response){
        const treeActiveFile = response;
        if (!treeActiveFile) {
            return;
        }
        //yield call(delay, 500)
        if (!confirm(`Are you sure you want to delete '${treeActiveFile.name}'?`)) {
            return;
        }
        yield put(fsActions.deleteFile(activeNodePath));
    }

    if(error && error.message){
        alert(error.message);
        yield put(fsActions.deleteFile(activeNodePath));
    }
}

export function* showContextMenu({ payload }) {
    const { type, event } = payload;
    if (!Menus.hasOwnProperty(type)) {
        console.warn(`Menu type "${type}" not found.`);
        return;
    }
    const menuItems = Menus[type];
    const { clientX, clientY } = event;

    const options = {
        x: clientX,
        y: clientY,
    };
    yield call(services.mainIpc.call, 'MenuService', 'popup', [menuItems, options]);
}

export function* getOrFetchFileInfo(path) {
    const files = yield select(state => state.fs.files);
    let fileInfo = files.hasOwnProperty(path) ? files[path] : null;    
    if (fileInfo) {
        return { response: fileInfo, error: null };
    }


    const { response, error } = yield putAndTake(
        fsActions.fetchFileInfo(path)
    );
    if (error || !response) {
        console.warn(`Cannot fetch file information: ${path}`, error);
    }
    return { response, error };
}

function getUnsavedFiles(files) {
    if (!files) {
        return;
    }
    const unsavedFiles = [];
    for (let filePath of Object.keys(files)) {
        const file = files[filePath];
        if (file && file.modified) {
            unsavedFiles.push(file);
        }
    }
    return unsavedFiles;
}
