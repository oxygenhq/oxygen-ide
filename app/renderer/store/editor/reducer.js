/* eslint-disable no-prototype-builtins */
/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

const DEFAULT_STATE = {
    activeFile: null,
    activeFileName: null,
    openFiles: {},
    toolbarButtonsState: {
        cutCopy: false,
    }
};

const DEFAULT_OPEN_FILE_STATE = {
    activeLine: null,
    activeLineUpdateTime: null,
};

export default (state = DEFAULT_STATE, action) => {
    const { name, path, newPath, line, time, cache, doUnknown, fromIndex, toIndex } = action.payload || {};
    let _openFilesClone, _newActiveFile, _newActiveFileName;

    switch (action.type) {
    // SET_ACTIVE_LINE
    case types.EDITOR_SET_ACTIVE_LINE: {

        console.log('--- debug EDITOR_SET_ACTIVE_LINE ---');
        console.log('line', line);
        console.log('path', path);
        console.log('--- debug ---');

        // check if we has file with the specified path in openFiles list
        if (!state.openFiles.hasOwnProperty(path)) {
            return state;
        }
        // prevent from updating activeLine if received message is older than the one we previously provided
        // we need this check to prevent updating current active line due to async misordered messages received from Oxygen
        if (state.openFiles[path].activeLineUpdateTime && state.openFiles[path].activeLineUpdateTime > time) {
            return state;
        }
        return { 
            ...state, 
            openFiles: {
                ...state.openFiles,
                [path]: {
                    ...state.openFiles[path],
                    activeLine: line,
                    activeLineUpdateTime: time,
                },
            },
        };
    }
    // RESET_ACTIVE_LINES
    case types.EDITOR_RESET_ACTIVE_LINES: {
        _openFilesClone = {
            ...state.openFiles,
        };
        Object.keys(state.openFiles).forEach(path => {
            if (_openFilesClone[path].activeLine) {
                _openFilesClone[path] = {
                    ...state.openFiles[path],
                    activeLine: null,
                };
            }
        });
        return {
            ...state,
            openFiles: _openFilesClone,
        };
    }

    // SET_ACTIVE_FILE
    case types.EDITOR_SET_ACTIVE_FILE: {
        if(path === 'unknown'){
            return { 
                ...state, 
                activeFile: path, 
                activeFileName: name 
            };
        } else {
            return { 
                ...state, 
                activeFile: path,
                activeFileName: null
            };
        }
    }

    // ADD_FILE
    case types.EDITOR_ADD_FILE: {
        if(path === 'unknown'){
            return { 
                ...state, 
                openFiles: {
                    ...state.openFiles,
                    [path+name]: {
                        ...DEFAULT_OPEN_FILE_STATE
                    },
                },
            };
        } else {
            return { 
                ...state, 
                openFiles: {
                    ...state.openFiles,
                    [path]: {
                        ...DEFAULT_OPEN_FILE_STATE
                    },
                },
            };
        }
    }

    // CLOSE_FILE
    case types.EDITOR_CLOSE_FILE: {   
        _openFilesClone = {};
        for (var filePath of Object.keys(state.openFiles)) {
            if(path === 'unknown'){
                if ((filePath !== path+name) && (filePath !== name)) {
                    _openFilesClone[filePath] = state.openFiles[filePath];
                }
            } else {
                if (filePath !== path) {
                    _openFilesClone[filePath] = state.openFiles[filePath];
                }
            }
        }
        _newActiveFile = state.activeFile;
        _newActiveFileName = state.activeFileName;
        // make sure we select another file, if active file has been closed

        let newActiveFile = state.activeFile;

        if(path === 'unknown'){
            if (path === state.activeFile && name === state.activeFileName) {
                const fileKeys = Object.keys(_openFilesClone);
                newActiveFile = fileKeys.length > 0 ? fileKeys[fileKeys.length - 1] : null;
            }
        } else {
            if (path === state.activeFile) {
                const fileKeys = Object.keys(_openFilesClone);
                newActiveFile = fileKeys.length > 0 ? fileKeys[fileKeys.length - 1] : null;
            }
        }
        if(
            (newActiveFile && 
        newActiveFile.startsWith && 
        newActiveFile.startsWith('unknown')) || 
        (newActiveFile && 
        newActiveFile.endsWith && 
        newActiveFile.endsWith('(deleted from disk)'))
        ){
            _newActiveFile = 'unknown';
            _newActiveFileName = newActiveFile;
        } else {
            _newActiveFile = newActiveFile;
            _newActiveFileName = null;
        }

        const newState = { 
            ...state, 
            openFiles: _openFilesClone,
            activeFile: _newActiveFile,
            activeFileName: _newActiveFileName
        };
        return newState;
    }

    // RENAME_FILE
    case types.EDITOR_RENAME_FILE: {


        let result;
        if (!state.openFiles.hasOwnProperty(path)) {
            result = state;
            return result;
        }
        _openFilesClone = {
            ...state.openFiles,
        };
        // remove old path
        delete _openFilesClone[path];
        // add new path
        _openFilesClone[newPath] = {
            ...DEFAULT_OPEN_FILE_STATE,
        };
      
        if(doUnknown){

            // update activeFile if its path has changed
            if(state.activeFile === path){
                _newActiveFile = 'unknown';
                _newActiveFileName = newPath;
            } else {
                _newActiveFile = state.activeFile;
                _newActiveFileName = state.activeFileName;
            }
        
            result = {
                ...state,
                activeFile: _newActiveFile,
                activeFileName: _newActiveFileName,
                openFiles: _openFilesClone,
            };
        
        } else {
        // update activeFile if its path has changed
            _newActiveFile = state.activeFile !== path ? state.activeFile : newPath;
            result = {
                ...state,
                activeFile: _newActiveFile,
                activeFileName: null,
                openFiles: _openFilesClone,
            };
        
        }

        return result;
    }

    case 'TABS_CHANGE_ORDER': {
        const _newList= {};
        const keys = Object.keys(state.openFiles);
        const firstItem = keys[fromIndex];
        
        keys[fromIndex] = keys[toIndex];
        keys[toIndex] = firstItem;
        keys.forEach(function(key) {
            _newList[key] = state.openFiles[key];
        });

        return {
            ...state,
            openFiles: _newList,
        };
    }

    case 'FROM_CACHE': 
        return {
            ...DEFAULT_STATE,
            ...cache.editor
        };

    case 'RESET': {
        return DEFAULT_STATE;
    }

    default:
        return state;
    }
};
