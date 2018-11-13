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

const mapStoreToProps = (state) => {
  // combine file data and editor related metadata
  const openFiles = Object.keys(state.editor.openFiles).map(path => ({
    ...state.fs.files[path],
    ...state.editor.openFiles[path],
  }));

  return {
    activeFile: state.editor.activeFile,
    openFiles: openFiles, //state.editor.openFiles,
  };
};
  
const mapDispatchToProps = (dispatch) => (
  bindActionCreators({ ...editorActions } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(TextEditor);
