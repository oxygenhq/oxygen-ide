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
import Workbench from './Workbench.js';
import * as wbActions from '../../store/workbench/actions';
import * as testActions from '../../store/test/actions';
import * as settingsActions from '../../store/settings/actions';
import { stopWaitChromeExtension } from '../../store/recorder/actions';
import { move } from '../../store/fs/actions';
import { startDownloadChromeDriver, showDownloadChromeDriverError, startDownloadEdgeDriver, showDownloadEdgeDriverError } from '../../store/dialog/actions';

const mapStoreToProps = (state) => {
    const activeNode = state.fs.tree.activeNode;
    const rootPath = state.fs.rootPath || null;

    const { activeFile, activeFileName } = state.editor;

    let fullEditorActiveFile = null;
    let editorActiveFilePossibleRepoPath = null;
 
    if (activeFile) {
        if (activeFile === 'unknown') {
            const key = activeFile+activeFileName;
            fullEditorActiveFile = state.settings.files.hasOwnProperty(key) ? state.settings.files[key] : null;
        } else {
            fullEditorActiveFile = state.fs.files.hasOwnProperty(activeFile) ? state.fs.files[activeFile] : null;

            if (fullEditorActiveFile && fullEditorActiveFile.path && !fullEditorActiveFile.path.endsWith('.repo.js')) {
        
                const splitResult = fullEditorActiveFile.path.split('.js');
                splitResult.pop();
                splitResult.push('.repo.js');
                editorActiveFilePossibleRepoPath = splitResult.join('');
            }
        }
    }

    return {
        initialized: state.wb && state.wb.initialized,
        javaError: state.wb.javaError,
        xCodeError: state.wb.xCodeError,
        androidHomeError: state.wb.androidHomeError,
        isRecordingChrome: state.recorder.isRecordingChrome,
        isRecordingFirefox: state.recorder.isRecordingFirefox,
        canRecordChrome: state.recorder.canRecordChrome,
        canRecordFirefox: state.recorder.canRecordFirefox,
        isChromeExtensionEnabled: state.recorder.isChromeExtensionEnabled,
        waitChromeExtension: state.recorder.waitChromeExtension,
        waitFirefoxExtension: state.recorder.waitFirefoxExtension,
        settings: state.settings,
        test: state.test,
        dialog: state.dialog,
        treeActiveFile: activeNode && state.fs.files.hasOwnProperty(activeNode) ? state.fs.files[activeNode] : null,
        editorActiveFile: fullEditorActiveFile,
        rootPath: rootPath,
        objrepoPath : state.objrepo.path,
        objrepoName : state.objrepo.name,
        editorActiveFilePossibleRepoPath: editorActiveFilePossibleRepoPath
    };
};
  
const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ 
        ...wbActions, 
        ...testActions, 
        ...settingsActions, 
        move, 
        stopWaitChromeExtension, 
        startDownloadChromeDriver, 
        showDownloadChromeDriverError,
        startDownloadEdgeDriver,
        showDownloadEdgeDriverError
    } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(Workbench);
