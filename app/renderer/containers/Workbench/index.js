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
import Workbench from './Workbench';
import * as wbActions from '../../store/workbench/actions';
import * as testActions from '../../store/test/actions';
import * as settingsActions from '../../store/settings/actions';
import * as recorderActions from '../../store/recorder/actions';
import { move } from '../../store/fs/actions';

const mapStoreToProps = (state) => {
  const activeNode = state.fs.tree.activeNode;
  const editorActiveFile = state.editor.activeFile;
  const rootPath = state.fs.rootPath || null;
  return {
    isRecording: state.recorder.isRecording,
    settings: state.settings,
    test: state.test,
    dialog: state.dialog,
    treeActiveFile: activeNode && state.fs.files.hasOwnProperty(activeNode) ? state.fs.files[activeNode] : null,
    editorActiveFile: editorActiveFile && state.fs.files.hasOwnProperty(editorActiveFile) ? state.fs.files[editorActiveFile] : null,
    rootPath: rootPath
  };
};
  
const mapDispatchToProps = (dispatch) => (
  bindActionCreators({ ...wbActions, ...testActions, ...settingsActions, move } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(Workbench);
