/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @flow
// import uniqid from 'uniqid';
// import cloneDeep from 'lodash/cloneDeep';
// import uniqBy from 'lodash/uniqBy';
import React, { Component, Fragment } from 'react';
import { message, Icon } from 'antd';

import MonacoEditor from '../../components/MonacoEditor';
import ideTheme from './theme.json';
import '../../css/editor.scss';

import SupportedExtensions from '../../helpers/file-extensions';
import editorSubjects from '../../store/editor/subjects';
import fileSubjects from '../../store/fs/subjects';
import Landing from '../../components/Landing';

type Props = {
  editorReadOnly: boolean,
  fontSize: number,
  activeFile: null | object,
  openFiles: null | {[key: string]: object},
  onBreakpointsUpdate: (Array<any>) => void,
  onContentUpdate: (string, string) => void,
};

const DEFAULT_EDITOR_LANGUAGE = 'javascript';

const getKey = (file) => {
    if(file && file.path && file.name && file.path === 'unknown'){
        return file.path+file.name;
    }
    if(file && file.path){
        return file.path;
    }

    return +new Date;
};

const getVisible = (file, activeFile, activeFileName) => {
    if(activeFile && file && file.path && file.name && file.path === 'unknown'){
        return file.path === activeFile && file.name === activeFileName;
    }

    if(activeFile && file && file.path){
        return file.path === activeFile;
    }

    return false;
};

export default class TextEditor extends Component<Props> {
  props: Props;

  constructor(props) {
      super(props);
      // keeps reference to Rxjs subscriptions  
      this.subscriptions = {};
      // subscribe to the relevant subjects
      this.subscriptions['EDITOR.TRIGGER'] = editorSubjects['EDITOR.TRIGGER'].subscribe(::this.onEditorCallTrigger);
      this.subscriptions['FILE.RENAMED'] = fileSubjects['FILE.RENAMED'].subscribe(::this.onFileRenamed);
      // keeps references to all open editors
      this.editors = {};
  }

  componentWillUnmount() {
      if (this.subscriptions['EDITOR.TRIGGER']) {
          this.subscriptions['EDITOR.TRIGGER'].unsubscribe();
      }
      if (this.subscriptions['FILE.RENAMED']) {
          this.subscriptions['FILE.RENAMED'].unsubscribe();
      }
  }

  onEditorCallTrigger(payload = {}) {
      const { activeFile } = this.props;
      const { trigger } = payload;
      const editor = this.editors[activeFile];

      if (editor && typeof editor.trigger === 'function') {
          editor.trigger(trigger);
      }
  }

  onFileRenamed(payload = {}) {
      const { newPath, oldPath } = payload;
      if (!newPath || !oldPath) {
          return; // ignore invalid payload
      }
      // if the renamed file had a reference to an editor, make sure to change it's key in 'editors' hash, from old to the new one
      if (this.editors.hasOwnProperty(oldPath)) {
          const editorRef = this.editors[oldPath];
          delete this.editors[oldPath];
          this.editors[newPath] = editorRef;
      }
  }

  handleValueChange(filePath, value, name) {
      this.props.onContentUpdate(filePath, value, name);
  }

  handleSelectionChange(filePath, selectedText) {
      // TODO: add here handler for selection-related actions
  }

  render() {
      const { 
          activeFile, 
          openFiles, 
          editorReadOnly, 
          fontSize,
          activeFileName
      } = this.props;
      const self = this;

      if(activeFile === 'welcome'){
          return (<Landing/>);
      }

      return (
          <Fragment>
              { openFiles.map( file => {
                  // NOTE: file.path might be null when 'render' method is called in the middle of file rename process. 
                  // In this case, we will just ignore render method as it will be shortly called again with the updated file path.
                  if (!file || !file.path) {
                      return null;
                  }

                  const language = SupportedExtensions[file.ext] || DEFAULT_EDITOR_LANGUAGE;
                  // file.language

                  return (
                      <MonacoEditor
                          ref={(ref) => { self.editors[file.path] = ref; }}
                          key={getKey(file)}
                          value={file.content}
                          language={language}
                          activeLine={file.activeLine}
                          visible={getVisible(file, activeFile, activeFileName)}
                          editorReadOnly={editorReadOnly}
                          fontSize={fontSize}
                          breakpoints={file.breakpoints || []}
                          onBreakpointsUpdate={(bps) => this.props.onBreakpointsUpdate(file.path, bps, file.name)}
                          onValueChange={(bps) => ::this.handleValueChange(file.path, bps, file.name)}
                          onSelectionChange={(bps) => ::this.handleSelectionChange(file.path, bps)}
                      />
                  );
              })}
              {(!activeFile || openFiles.length === 0) && (
                  <div className="noFilesPlaceholder">
                      <div>
                          <Icon type="inbox" />
                          <p>You have no active opened files</p>
                          <p>Open a folder first, then select a file or create a new file</p>
                          { process.platform === 'win32' || process.platform === 'linux' ?
                              <div>
                                  <p><b>Ctrl + O</b> - Open folder</p>
                                  <p><b>Ctrl + N</b> - New file</p>
                              </div>
                              : 
                              <div>
                                  <p><b>Command + O</b> - Open folder</p>
                                  <p><b>Command + N</b> - New file</p>
                              </div>
                          }
                      </div>
                  </div>
              )}
          </Fragment>
      );
  }
}

