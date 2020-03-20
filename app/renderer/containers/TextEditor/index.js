/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import TextEditor from './TextEditor.jsx';
import * as editorActions from '../../store/editor/actions';
import { zoomIn, zoomOut } from '../../store/settings/actions';

const checkForBreakpoints = (path, breakpoints) => {
    let result = [];

    if(path && breakpoints && breakpoints[path]){
        result = breakpoints[path];
    }

    return result;
};

const mapStoreToProps = (state) => {
    let breakpoints;

    if(state && state.test && state.test.breakpoints){
        breakpoints = state.test.breakpoints;
    }

    let disabledBreakpoints;

    if(state && state.test && state.test.disabledBreakpoints){
        disabledBreakpoints = state.test.disabledBreakpoints;
    }

    let resolvedBreakpoints;
    if(state && state.test && state.test.resolvedBreakpoints){
        resolvedBreakpoints = state.test.resolvedBreakpoints;
    }

    // combine file data and editor related metadata
    let openFiles = Object.keys(state.editor.openFiles).map(path => {


        if(path.startsWith('unknownUntitled')){
            return {
                ...state.settings.files[path],
                ...state.editor.openFiles[path]
            };
        } else if(path.endsWith('(deleted from disk)')){

            let fileData = null;

            if(state.settings.files['unknown'+path]){
                fileData = { ...state.settings.files['unknown'+path] };
            } else if(state.settings.files[path]){
                fileData = { ...state.settings.files[path] };
            }

            if(fileData){
                return {
                    ...fileData,
                    ...state.editor.openFiles[path],
                };
            }

        } else {
            return {
                ...state.fs.files[path],
                ...state.editor.openFiles[path],
                breakpoints: checkForBreakpoints(path, breakpoints),
                disabledBreakpoints: checkForBreakpoints(path, disabledBreakpoints),
                resolvedBreakpoints: checkForBreakpoints(path, resolvedBreakpoints)
            };
        }
    });

    openFiles = openFiles.filter(function (el) {
        return el != null;
    });

    return {
        editorReadOnly: state.test.isRunning,
        activeFile: state.editor.activeFile,
        activeFileName: state.editor.activeFileName,
        fontSize: state.settings.fontSize,
        openFiles: openFiles, //state.editor.openFiles,
        waitUpdateBreakpoints: state.test.waitUpdateBreakpoints,
    };
};
  
const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ ...editorActions, zoomIn, zoomOut } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(TextEditor);
