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
import TextEditor from './TextEditor';
import * as editorActions from '../../store/editor/actions';
import { zoomIn, zoomOut } from '../../store/settings/actions';


const mapStoreToProps = (state) => {
  // combine file data and editor related metadata
  const openFiles = Object.keys(state.editor.openFiles).map(path => {
    if(path.startsWith('unknownUntitled')){
      return {
        ...state.settings.files[path],
        ...state.editor.openFiles[path],
      }
    } else {
      return {
        ...state.fs.files[path],
        ...state.editor.openFiles[path],
      }
    }
  });

  return {
    editorReadOnly: state.test.isRunning,
    activeFile: state.editor.activeFile,
    activeFileName: state.editor.activeFileName,
    fontSize: state.settings.fontSize,
    openFiles: openFiles, //state.editor.openFiles,
  };
};
  
const mapDispatchToProps = (dispatch) => (
  bindActionCreators({ ...editorActions, zoomIn, zoomOut } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(TextEditor);
