/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import uuidv4 from'uuid/v4';
import { all, put, select, takeLatest, call } from 'redux-saga/effects';
import { putAndTake } from '../../helpers/saga';
import pathHelper from 'path';
import { 
    createElementInRepoRoot,
    createContainerInRepoRoot,
    renameElementOrContaimerInRepoRoot,
    removeElementOrContaimerInRepoRoot,
    deleteLocatorInRepoRoot,
    updateLocatorValueInRepoRoot,
    updateArrayObjecLocatorValueInRepoRoot,
    addLocatorInRepoRoot,
    addArrayObjectLocatorInRepoRoot,
    deleteObjectOrFolder,
    deleteArrayObjectLocator,
    renameLocatorInRepoRoot,
    moveLocatorInRepoRoot,
    moveArrayObjectLocatorInRepoRoot
} from '../../helpers/objrepo';
import { notification } from 'antd';

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
import { reportError, setUserIdToSentry } from '../sentry/actions';
import * as orActions from '../obj-repo/actions';

import { success } from '../../helpers/redux';

import ActionTypes from '../types';
import { MAIN_MENU_EVENT, MAIN_SERVICE_EVENT } from '../../services/MainIpc';
import { JAVA_NOT_FOUND, JAVA_BAD_VERSION } from '../../services/JavaService';

import ServicesSingleton from '../../services';
import editorSubjects from '../editor/subjects';

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
        takeLatest(ActionTypes.WB_CREATE_OBJECT_ELEMENT, createObjectElement),
        takeLatest(ActionTypes.WB_CREATE_OBJECT_CONTAINER, createObjectContainer),
        takeLatest(ActionTypes.WB_RENAME_OBJECT_ELEMENT_OR_CONTAINER, renameObjectElementOrContainer),
        takeLatest(ActionTypes.WB_REMOVE_OBJECT_ELEMENT_OR_CONTAINER, removeObjectElementOrContainer),
        takeLatest(ActionTypes.WB_ADD_LOCATOR, addLocator),
        takeLatest(ActionTypes.WB_ADD_ARRAY_OBJECT_LOCATOR, addArrayObjectLocator),
        takeLatest(ActionTypes.WB_MOVE_LOCATOR, moveLocator),
        takeLatest(ActionTypes.WB_MOVE_ARRAY_OBJECT_LOCATOR, moveArrayObjectLocator),
        takeLatest(ActionTypes.WB_DELETE_LOCATOR, deleteLocator),
        takeLatest(ActionTypes.WB_UPDATE_LOCATOR, updateLocator),
        takeLatest(ActionTypes.WB_UPDATE_LOCATOR_VALUE, updateLocatorValue),
        takeLatest(ActionTypes.WB_UPDATE_ARRAY_OBJECT_LOCATOR_VALUE, updateArrayObjecLocatorValue),
        takeLatest(ActionTypes.WB_REMOVE_OBJECT_OR_FOLDER, removeObjectOrFolder),
        takeLatest(ActionTypes.WB_REMOVE_ARRAY_OBJECT_LOCATOR, removeArrayObjectLocator),
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
        takeLatest(JAVA_NOT_FOUND, handleJavaNotFound),
        takeLatest(JAVA_BAD_VERSION, handleJavaBadVersion),
        takeLatest(ActionTypes.WB_OR_ADD_TO_ROOT, orAddToRoot),
        takeLatest(ActionTypes.TEST_UPDATE_RUN_SETTINGS, setCloudProvidersBrowsersAndDevices)
        
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
        yield editorSubjects['EDITOR.TRIGGER'].next({ trigger: 'undo' });
    }
    else if (cmd === Const.MENU_CMD_REDO) {
        yield editorSubjects['EDITOR.TRIGGER'].next({ trigger: 'redo' });
    }
    else if (cmd === Const.MENU_CMD_SELECT_ALL) {
        yield editorSubjects['EDITOR.TRIGGER'].next({ trigger: 'selectall' });
    }
    else if (cmd === Const.MENU_CMD_FIND) {
        yield editorSubjects['EDITOR.TRIGGER'].next({ trigger: 'find' });
    }
    else if (cmd === Const.MENU_CMD_REPLACE) {
        yield editorSubjects['EDITOR.TRIGGER'].next({ trigger: 'replace' });
    }
    else if (cmd === Const.MENU_CMD_HELP_CHECK_UPDATES) {
        /* eslint-disable */
        yield services.mainIpc.call('UpdateService', 'start', [true]);
        /* eslint-enable */
    }
    else if (cmd === Const.MENU_CMD_OPEL_LOG_FILE) {
        try {
            const filePath = yield call(services.mainIpc.call, 'ElectronService', 'getLogFilePath', []);
            if(filePath && typeof filePath === 'string'){
                yield put(wbActions.openFile(filePath));
            }
        } catch(e){
            console.log('MENU_CMD_OPEL_LOG_FILE e'. e);
        }
    }
    else if (cmd === Const.MENU_CMD_CLEAR_ALL) {
        yield services.mainIpc.call('ElectronService', 'clearSettings');
        yield services.mainIpc.call('FileService', 'closeWatcherIfExist');
        yield clearAll();
        yield initialize();
    }
    else if (cmd === Const.MENU_CMD_OPEN_FOLDER) {
        yield put(wbActions.showDialog('OPEN_FOLDER'));
    }
    else if (cmd === Const.MENU_CMD_OPEN_FILE) {
        yield put(wbActions.showDialog('OPEN_FILE'));
    }
    else if (cmd === Const.MENU_CMD_ORE_NEW_ELEMENT) {
        yield showNewObjectElementDialog({});
    }
    else if (cmd === Const.MENU_CMD_ORE_RENAME_ELEMENT){
        yield showRenameObjectElementOrContainerDialog({ type : 'element' });
    }
    else if (cmd === Const.MENU_CMD_ORE_RENAME_CONTAINER){
        yield showRenameObjectElementOrContainerDialog({ type : 'container' });
    }
    else if (cmd === Const.MENU_CMD_ORE_DELETE_ELEMENT){
        yield showRemoveObjectElementOrContainerDialog({ type : 'element' });
    }
    else if (cmd === Const.MENU_CMD_ORE_DELETE_CONTAINER){
        yield showRemoveObjectElementOrContainerDialog({ type : 'container' });
    }
    else if (cmd === Const.MENU_CMD_ORE_NEW_CONTAINER) {
        yield showNewObjectContainerDialog({});
    }
    else if (cmd === Const.MENU_CMD_ORE_COPY_OBJECT) {
        yield copyObject({});
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
    } else if (cmd === Const.MENU_CMD_OPEN_OR_FILE) {
        yield openOrFile({});
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

export function* handleJavaNotFound(inner){
    yield put(wbActions.setJavaError({
        reason: 'not-found'
    }));
}

export function* handleJavaBadVersion({ payload }){
    const { version } = payload;
    yield put(wbActions.setJavaError({
        reason: 'bad-version',
        version: version
    }));
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
    yield call(services.mainIpc.call, 'SeleniumService', 'stop');
}

export function* initialize() {
    yield put(testActions.waitUpdateBreakpoints(false));
    // start check for update
    services.mainIpc.call('UpdateService', 'start', [false]);
    // start Android and iOS device watcher
    services.mainIpc.call('DeviceDiscoveryService', 'start').catch((e) => console.error(e.message));

    // get app settings from the store
    let appSettings = yield call(services.mainIpc.call, 'ElectronService', 'getSettings');

    if(appSettings && appSettings.cache){
        yield putAndTake(wbActions.restoreFromCache(appSettings.cache));

        try{
            yield call(services.javaService.checkJavaVersion);
        } catch(error){
            console.warn('Failure checking Java', error);
            
            yield put(reportError(error));
            
        }

        if(appSettings.cache.settings && appSettings.cache.settings.uuid){
            yield call(services.mainIpc.call, 'AnalyticsService', 'setUser', [appSettings.cache.settings.uuid]); 
            yield put(setUserIdToSentry(appSettings.cache.settings.uuid));
            
        } else {
            const uuid = uuidv4();
            yield call(services.mainIpc.call, 'AnalyticsService', 'createUser', [uuid]);
            yield put(settingsActions.createUser(uuid));
            yield put(setUserIdToSentry(uuid));
        }

    } else {
        yield put(settingsActions.changeCacheUsed(true));

        const uuid = uuidv4();

        yield call(services.mainIpc.call, 'AnalyticsService', 'createUser', [uuid]);
        yield put(settingsActions.createUser(uuid));
        yield put(settingsActions.firstOpen());
        yield put(setUserIdToSentry(uuid));

        if(appSettings){
            appSettings.cacheUsed = true;
        }
    }

    // start Selenium server
    const seleniumPid = yield services.mainIpc.call('SeleniumService', 'start');

    if(seleniumPid){
        yield put(testActions.setSeleniumPid(seleniumPid));
    }

    if(appSettings && appSettings.lastSession && appSettings.lastSession.rootFolder){
        yield put(settingsActions.hildeLanding());
    } else {
        yield put(settingsActions.showLanding());
    }

    //start CloudProvidersService
    services.mainIpc.call('CloudProvidersService', 'start').then(() => {});
    yield setCloudProvidersBrowsersAndDevices();
    //start VisualTestingProvidersService
    services.mainIpc.call('VisualTestingProvidersService', 'start').then(() => {});
    yield setVisualTestingProviders();

    yield put({
        type: success(ActionTypes.WB_INIT),
    });
}

export function* openFolder({ payload }) {
    const { path } = payload;
    // check if there are any unsaved files - if so, prompt user and ask whether to proceed.
    const files = yield select(state => state.fs.files);
    const tabs = yield select(state => state.tabs);

    const unsaved = getUnsavedFiles(files, tabs);
    
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
    // report success
    yield put(wbActions._openFile_Success(path));
}

export function* changeTab({ payload }) {
    const { key, name } = payload;

    if(key === 'unknown'){
        yield put(tabActions.setActiveTab(key, name));
        yield put(testActions.setMainFile(key, name));
        yield put(editorActions.setActiveFile(key, name));
    } else {
        const { error } = yield putAndTake(
            editorActions.openFile(key, true)
        );
        // if any error occurs during openning tab's file content (e.g. file doesn't not exist), remove this tab
        if (error) {
            console.warn('error', error);
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
    const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [null, null, [ 
        { name: 'JavaScript file', extensions:['js'] },
        { name: 'All Files', extensions: ['*'] } 
    ]]);
    
    if (!saveAsPath) {
        return; // Save As dialog was canceled by user
    }
    
    let folderPath = saveAsPath.split(pathHelper.sep);
    folderPath.pop();
    folderPath = folderPath.join(pathHelper.sep);

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
            const currentFile = files[path+name];

            if(currentFile && saveAsFile && saveAsFile.path){
                yield closeTmpFile(currentFile, saveAsFile.path);
            }
        }

        const fs = yield select(state => state.fs);
                
        if(fs && typeof typeof fs.rootPath !== 'undefined' && fs.rootPath === null){
            const { error } = yield putAndTake(
                fsActions.treeOpenFolder(folderPath)
            );

            if (error) {
                console.warn('error');

                yield put(wbActions._openFile_Failure(folderPath, error));
                return;
            }   

            // report success
            yield put(wbActions._openFile_Success(folderPath));
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
            if(tab && tab.title && tab.key && tab.key === 'unknown'){
                const number = parseInt(tab.title.replace( /^\D+/g, ''));

                if(isNaN(number)){
                    // ignore
                } else {
                    if(number > index){
                        index = number;
                    }
                }
            }
        });
    }

    return index;
};

export function* openFakeFile(){
    let tabs = yield select(state => state.tabs);
    let idenity;

    if(tabs && tabs.list && Array.isArray(tabs.list)){
        idenity = tabs.list.filter((tab) => tab.key === 'unknown');
        if(!idenity){
            idenity = [];
        }
    } else {
        idenity = [];
    }

    const key = 'unknown';
    let name = 'Untitled-'+(idenity.length+1);

    
    const tmpFileExist = tabs.list.some((tab) => tab.key === key && tab.title === name );

    if(tmpFileExist){
        const index = getMaxIndex(tabs.list);
        if(index === 0){
            const timestamp = + new Date();
            name = 'Untitled-'+(timestamp);
        } else {
            name = 'Untitled-'+(index+1);
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
    const { path, force } = payload;

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

    if(!force){
        if(file && file.name && file.parentPath && file.name.endsWith('.js') && !file.name.endsWith('.repo.js')){
            const splitResult = file.name.split('.js');
            
            splitResult.pop();
            splitResult.push('.repo.js');
            const repoFileName = file.parentPath+pathHelper.sep+splitResult.join('');

            
            const fetchFileInfo = yield putAndTake(
                fsActions.fetchFileInfo(repoFileName)
            );

            // check if this is an object repository file and handle it separately
            if (fetchFileInfo && fetchFileInfo.response) {
                yield openObjectRepositoryFile(fetchFileInfo.response);
            } else {
                yield put(settingsActions.setSidebarVisible('right', false));
            }
        }

        // if we are here, it means we are trying to open a regular file (not object repository)
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

export function* openObjectRepositoryFile(file) {
    yield put(orActions.openFile(file.path));
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

export function* createObjectContainer({ payload }) {

    const objrepo = (yield select(state => state.objrepo)) || null;
    // name - object name
    const { path, name } = payload;
    const { start, end, repoRoot, parent } = objrepo;

    let repoRootCopy = { ...repoRoot };
   
    const result = createContainerInRepoRoot(repoRootCopy, path, parent );

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ name,  newFileContent, true]);
}

export function* createObjectElement({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    // name - object name
    const { path, name } = payload;
    
    const { start, end, repoRoot, parent } = objrepo;
    let repoRootCopy = { ...repoRoot };
   
    const result = createElementInRepoRoot(repoRootCopy, path, parent );

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ name,  newFileContent, true]);
}

export function* renameObjectElementOrContainer({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    
    const { path, type, newName } = payload;
    
    const { start, end, repoRoot, parent } = objrepo;
    let repoRootCopy = { ...repoRoot };
   
    const result = renameElementOrContaimerInRepoRoot(repoRootCopy, parent, type, newName);

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    
    yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
}

export function* removeObjectElementOrContainer({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    
    const { path, type } = payload;
    
    const { start, end, repoRoot, parent } = objrepo;
    let repoRootCopy = { ...repoRoot };
   
    const result = removeElementOrContaimerInRepoRoot(repoRootCopy, parent, type);

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    
    yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
}

export function* removeObjectOrFolder({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, name } = payload;
    
    const { start, end, repoRoot } = objrepo;
    let repoRootCopy = { ...repoRoot };

    const result = deleteObjectOrFolder(repoRootCopy, path, name);

    repoRootCopy = result;
    

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}

export function* removeArrayObjectLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, idx } = payload;

    const { start, end, repoRoot } = objrepo;
    let repoRootCopy = { ...repoRoot };

    const result = deleteArrayObjectLocator(repoRootCopy, path, idx);

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}
export function* updateLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, newName, oldName } = payload;
    
    const { start, end, repoRoot } = objrepo;
    let repoRootCopy = { ...repoRoot };
    

    const result = renameLocatorInRepoRoot(repoRootCopy, path, newName, oldName);

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}

export function* moveLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, name, direction, index } = payload;
    
    const { start, end, repoRoot } = objrepo;
    let repoRootCopy = { ...repoRoot };

    const result = moveLocatorInRepoRoot(repoRootCopy, path, name, direction, index);

    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}

export function* moveArrayObjectLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, index, direction } = payload;
    const { start, end, repoRoot } = objrepo;
    let repoRootCopy = { ...repoRoot };

    const result = moveArrayObjectLocatorInRepoRoot(repoRootCopy, path, index, direction);

    repoRootCopy = result;
    
    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}

export function* addLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, name } = payload;
    
    const { start, end, repoRoot } = objrepo;
    
    let repoRootCopy = { ...repoRoot };
    const result = addLocatorInRepoRoot(repoRootCopy, path, name);
    
    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}

export function* addArrayObjectLocator({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, name } = payload;
    
    const { start, end, repoRoot } = objrepo;
    
    let repoRootCopy = { ...repoRoot };
    const result = addArrayObjectLocatorInRepoRoot(repoRootCopy, path, name);
    
    repoRootCopy = result;

    const repoRootString = JSON.stringify( repoRootCopy );
    const newFileContent = start+repoRootString+end;
    if(objrepo && objrepo.path){
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ objrepo.path,  newFileContent, true]);
    }
}


export function* deleteLocator({ payload }) {    
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { start, end, repoRoot, path } = objrepo;
    const { obj } = payload;
    
    if (path && obj) {

        let repoRootCopy = { ...repoRoot };
        const result = deleteLocatorInRepoRoot(repoRootCopy, obj);
        
        repoRootCopy = result;
        const repoRootString = JSON.stringify( repoRootCopy );
        const newFileContent = start+repoRootString+end;
        
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
        
    } else {
        console.warn('no path');
    }
}

export function* updateLocatorValue({ payload }) {    
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { start, end, repoRoot, path } = objrepo;
    
    if (path && payload.path && payload.newValue) {

        let repoRootCopy = { ...repoRoot };
        const result = updateLocatorValueInRepoRoot(repoRootCopy, payload.path, payload.newValue);
        
        repoRootCopy = result;
        const repoRootString = JSON.stringify( repoRootCopy );
        const newFileContent = start+repoRootString+end;
        
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
        
    } else {
        console.warn('no path');
    }
}

export function* updateArrayObjecLocatorValue ({ payload }) {    
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { start, end, repoRoot, path } = objrepo;
    
    if (path && payload.path && payload.newValue) {

        let repoRootCopy = { ...repoRoot };
        const result = updateArrayObjecLocatorValueInRepoRoot(repoRootCopy, payload.path, payload.newValue, payload.idx);
        
        repoRootCopy = result;

        const repoRootString = JSON.stringify( repoRootCopy );
        const newFileContent = start+repoRootString+end;
        
        yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
        
    } else {
        console.warn('no path');
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
    const { path, force = false, name = null, showDeleteTitle = false } = payload;
    const file = yield select(state => state.fs.files[path]);
    // prompt user if file has been modified and unsaved
    if (file && force == false && file.modified && file.modified == true) {
        if (!confirm(`Are you sure you want to close unsaved file ${file.name}?`)) {
            return;
        }
    }

    if(showDeleteTitle && path){
        const pathSplit = path.split(pathHelper.sep);

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

    if(path === 'unknown'){

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
    for (var filePath of Object.keys(openFiles)) {
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
                alert('Sorry, we don\'t support opening root disks. Please select a folder.');
            } else {
                yield openFolder({ payload: { path: paths[0] }});
            }
        }
    }
    else if (dialog === 'OPEN_FILE') {
        const paths = yield call(services.mainIpc.call, 'ElectronService', 'showOpenFileDialog', []);
        if (paths && Array.isArray(paths) && paths.length > 0) {
            for (var path of paths) {
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

    if(path === 'unknown'){
        yield put(settingsActions.updateFileContent(path, content, name));
    } else {
        yield put(fsActions.updateFileContent(path, content));
    }
}

export function* closeTmpFile(file, realFilePath){
    yield put(editorActions.closeFile(file.path, false, file.name));
    yield put(tabActions.removeTab(file.path, file.name));
    yield put(settingsActions.removeFile(file.path, file.name));
    yield put(testActions.moveBreakpointsFromTmpFileToRealFile(file.path, file.name, realFilePath));
}

export function* saveCurrentFile({ payload }) {
    const { prompt } = payload || {};
    const editor = yield select(state => state.editor);
    const recorder = yield select(state => state.recorder);
    const fsRootPath = yield select(state => state.fs.rootPath);
    let rootPath = null;

    if(fsRootPath){
        rootPath = fsRootPath;
    }

    const { activeFile, activeFileName } = editor;

    if(activeFile === 'unknown'){
        const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [activeFileName, rootPath, [ 
            { name: 'JavaScript file', extensions:['js'] },
            { name: 'All Files', extensions: ['*'] } 
        ] ]);
    
        if (!saveAsPath) {
            return; // Save As dialog was canceled by user
        }

        let folderPath = saveAsPath.split(pathHelper.sep);
        folderPath.pop();
        folderPath = folderPath.join(pathHelper.sep);

        const files = yield select(state => state.settings.files);
        
        const currentFile = files[activeFile+activeFileName];

        let saveContent = currentFile && currentFile.content;

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
                yield closeTmpFile(currentFile, saveAsPath);
            }

            const fs = yield select(state => state.fs);
            
            if(fs && typeof typeof fs.rootPath !== 'undefined' && fs.rootPath === null){
                const { error } = yield putAndTake(
                    fsActions.treeOpenFolder(folderPath)
                );
    
                if (error) {
                    yield put(wbActions._openFile_Failure(folderPath, error));
                    return;
                }   
    
                // report success
                yield put(wbActions._openFile_Success(folderPath));
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

        if (!activeFile || !files.hasOwnProperty(activeFile)) {
            return;
        }

        const currentFile = files[activeFile];

        // prompt user with "Save As" dialog before saving the file
        if (prompt) {
            const saveAsPath = yield call(services.mainIpc.call, 'ElectronService', 'showSaveDialog', [null, activeFile, [ 
                { name: 'JavaScript file', extensions:['js'] },
                { name: 'All Files', extensions: ['*'] } 
            ] ]);
            if (!saveAsPath) {
                return; // Save As dialog was canceled by user
            }

            let saveContent = currentFile && currentFile.content;

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
            }
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
    const { path } = payload;

    const files = yield select(state => state.fs.files);
    const objrepoPath = yield select(state => state.objrepo.path);
    

    if(path && !path.endsWith('.repo.js')){
        const splitResult = path.split('.js');
        splitResult.pop();
        splitResult.push('.repo.js');
        const repoFilePath = splitResult.join('');
        const repoFile = files[repoFilePath];
    
        if(repoFile && objrepoPath && repoFilePath === objrepoPath){
            yield put(orActions.clearObjectRepositoryFile());
        }
    }

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

export function* showNewObjectContainerDialog({ payload }) {
    const path = (yield select(state => state.objrepo.path)) || null;
    if (path) {
        yield put(
            wbActions.showDialog('DIALOG_OBJECT_CONTAINER_CREATE', { type: 'container', path: path })
        );
    }
}

export function* copyStringToClipboard(str) {
    let result = false;
    try {
        // Create new element
        const el = document.createElement('textarea');
        // Set value (string to be copied)
        el.value = str;
        // Set non-editable to avoid focus and move outside of view
        el.setAttribute('readonly', '');
        el.style = {position: 'absolute', left: '-9999px'};
        document.body.appendChild(el);
        // Select text inside element
        el.select();
        // Copy text to clipboard
        document.execCommand('copy');
        // Remove temporary element
        document.body.removeChild(el);

        result = true;
    } catch(error){
        console.warn('copyStringToClipboard error', error);
        yield put(reportError(error));
        result = false;
    }
    return result;
}

const openCopyNotificationWithIcon = type => {
    notification[type]({
        message: 'Copy object',
        description: type,
    });
};

export function* copyObject({ payload }) {
    try{    
        const objrepo = (yield select(state => state.objrepo)) || null;
    
        if(objrepo){    
            const { parent } = objrepo;

            if(parent && parent.path) {
                const copyResult = yield copyStringToClipboard(parent.path);

                if(copyResult){
                    openCopyNotificationWithIcon('success');
                } else {
                    openCopyNotificationWithIcon('error');
                }
            } else {
                openCopyNotificationWithIcon('error');
            }

        } else {
            openCopyNotificationWithIcon('error');
        }
    } catch(error){
        console.warn('copyObject error', error);
        openCopyNotificationWithIcon('error');
        yield put(reportError(error));
    }
}

export function* showNewObjectElementDialog({ payload }) {
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { path, parent } = objrepo;
    if (path) {
        let safeParent = null;
        if(parent) {
            safeParent = parent;
        }
        yield put(
            wbActions.showDialog('DIALOG_OBJECT_ELEMENT_CREATE', { type: 'element', path: path, parent: safeParent })
        );
    } else {
        console.warn('no path');
    }
}

export function* showRenameObjectElementOrContainerDialog({ type }) {
    const objrepo = (yield select(state => state.objrepo)) || null;

    const { path, parent } = objrepo;
    if (path) {
        let safeParent = null;
        if(parent) {
            safeParent = parent;
        }
        yield put(
            wbActions.showDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME', { type: type, path: path, parent: safeParent })
        );
    } else {
        console.warn('no path');
    }
}


export function* showRemoveObjectElementOrContainerDialog({ type }) {
    const objrepo = (yield select(state => state.objrepo)) || null;

    const { path, parent } = objrepo;
    if (path) {
        let safeParent = null;
        if(parent) {
            safeParent = parent;
        }
        yield put(
            wbActions.showDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE', { type: type, path: path, parent: safeParent })
        );
    } else {
        console.warn('no path');
    }
}

export function* showNewFileDialog({ payload }) {
    
    // const activeNode = (yield select(state => state.fs.tree.activeNode)) || null;
    const rootPath = (yield select(state => state.fs.rootPath)) || null;
    // const files = yield select(state => state.fs.files);
    // const treeActiveFile = activeNode && files.hasOwnProperty(activeNode) ? files[activeNode] : null;

    // if (treeActiveFile) {
    //     // in case the file is currently selected in the tree, create a new file in the same directory as the selected file
    //     if (treeActiveFile.type === 'file') {
    //         console.log('#1');
    //         yield put(
    //             wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'file', path: treeActiveFile.parentPath })
    //         );
    //     }
    //     // otherwise if folder is selected, create a new file inside the selected folder
    //     else {
    //         console.log('#2');
    //         yield put(
    //             wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'file', path: treeActiveFile.path })
    //         );
    //     }
    // }
    // else 
    if (rootPath) {
        yield put(
            wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'folder', path: rootPath })
        );
    } else {
        notification['error']({
            message: 'Please select root folder'
        });
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
    else if(activeNode){
        yield put(
            wbActions.showDialog('DIALOG_FILE_CREATE', { type: 'folder', path: activeNode })
        );
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

export function* openOrFile({ payload }) {
    const activeNodePath = (yield select(state => state.fs.tree.activeNode)) || null;
    if (!activeNodePath) {
        return;
    }

    yield openFile({payload: {path:activeNodePath, force: true}});
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
    const { type, event, node } = payload;
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
    if(node){
        yield put(orActions.setParent(node));
    } else {
        //clear when previon context was on folder, but next on object
        yield put(orActions.setParent());
    }
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

function fetchCloudBrowsersAndDevicesError(msg){
    notification['error']({
        message: msg,
        description: 'Unauthorized access, check your user name or access key'
    });
}

export function* setCloudProvidersBrowsersAndDevices(){
    try {
        const settings = yield select(state => state.settings);
        
        const { cloudProviders } = settings || {};
    
        if(cloudProviders){
            if(cloudProviders.lambdaTest && cloudProviders.lambdaTest.inUse && cloudProviders.lambdaTest.user && cloudProviders.lambdaTest.key){
                yield call(services.mainIpc.call, 'CloudProvidersService', 'updateProviderSettings', ['lambdaTest', cloudProviders.lambdaTest]);
                const browsersAndDevicesResult = yield call(services.mainIpc.call, 'CloudProvidersService', 'getBrowsersAndDevices', ['lambdaTest', cloudProviders.lambdaTest.user, cloudProviders.lambdaTest.key]);
                
                if(typeof browsersAndDevicesResult === 'string'){
                    fetchCloudBrowsersAndDevicesError(browsersAndDevicesResult);
                } else {
                    if(browsersAndDevicesResult){
                        yield put(settingsActions.setCloudProvidersBrowsersAndDevices(browsersAndDevicesResult, 'lambdaTest'));
                    }
                }

        
            }
            if(cloudProviders.sauceLabs && cloudProviders.sauceLabs.inUse){
                yield call(services.mainIpc.call, 'CloudProvidersService', 'updateProviderSettings', ['sauceLabs', cloudProviders.sauceLabs]);
                const browsersAndDevicesResult = yield call(services.mainIpc.call, 'CloudProvidersService', 'getBrowsersAndDevices', ['sauceLabs']);
        
                if(typeof browsersAndDevicesResult === 'string'){
                    fetchCloudBrowsersAndDevicesError(browsersAndDevicesResult);
                } else {
                    if(browsersAndDevicesResult){
                        yield put(settingsActions.setCloudProvidersBrowsersAndDevices(browsersAndDevicesResult, 'sauceLabs'));
                    }
                }
            }
            if(cloudProviders.testingBot && cloudProviders.testingBot.inUse){
                yield call(services.mainIpc.call, 'CloudProvidersService', 'updateProviderSettings', ['testingBot', cloudProviders.testingBot]);
                const browsersAndDevicesResult = yield call(services.mainIpc.call, 'CloudProvidersService', 'getBrowsersAndDevices', ['testingBot']);
        
                if(typeof browsersAndDevicesResult === 'string'){
                    fetchCloudBrowsersAndDevicesError(browsersAndDevicesResult);
                } else {
                    if(browsersAndDevicesResult){
                        yield put(settingsActions.setCloudProvidersBrowsersAndDevices(browsersAndDevicesResult, 'testingBot'));
                    }
                }
            }
        }
    } catch(e){
        console.log('e', e);
    }
}

export function* setVisualTestingProviders(){
    const settings = yield select(state => state.settings);
    
    const { visualProviders } = settings || {};

    if(visualProviders){
        if(visualProviders.applitools){
            yield call(services.mainIpc.call, 'VisualTestingProvidersService', 'updateProviderSettings', ['applitools', visualProviders.applitools]);
        }
    }
}

function getUnsavedFiles(files, tabs) {
    if (!files) {
        return;
    }
    const unsavedFiles = [];
    for (var filePath of Object.keys(files)) {
        const file = files[filePath];
        if (file && file.modified) {
            if(
                tabs && 
                tabs.list && 
                tabs.list.some && 
                tabs.list.some(({key}) => key === file.path)
            ){
                unsavedFiles.push(file);
            }
        }
    }
    return unsavedFiles;
}

const getValueByKey = key => {
    let result = false;

    try {
        switch(key){
        case 'container':
            result = {};
            break;
        case 'array_object':
            result = [];
            break;
        default:
            result = false;
        }
    } catch(e) {
        console.warn('e', e);
    }

    return result;
};
export function* orAddToRoot({payload}){    
    const objrepo = (yield select(state => state.objrepo)) || null;
    const { start, end, repoRoot, path } = objrepo;
    
    let safeStart;
    let safeEnd;

    if(!start){
        safeStart = 'const po = ';
    } else {
        safeStart = start;
    }
    
    if(!end){
        safeEnd = ';module.exports = po;';
    } else {
        safeEnd = end;
    }

    if (path && payload.name && payload.key) {

        const { name, key } = payload;

        let repoRootCopy;
        
        if(repoRoot){
            repoRootCopy = { ...repoRoot };
        } else {
            repoRootCopy = {};
        }
        
        if(repoRootCopy[name]){
            notification['error']({
                message: 'Tree item with this name already exist',
                description: name,
            });
        } else {
            const value = getValueByKey(key);
            
            if(false === value){
                notification['error']({
                    message: 'Bad key',
                    description: key,
                });
            } else {
                repoRootCopy[name] = value;
                
                const repoRootString = JSON.stringify( repoRootCopy );
                const newFileContent = safeStart+repoRootString+safeEnd;

                yield call(services.mainIpc.call, 'FileService', 'saveFileContent', [ path,  newFileContent, true]);
            }
        }
    } else {
        console.warn('no path');
    }

}