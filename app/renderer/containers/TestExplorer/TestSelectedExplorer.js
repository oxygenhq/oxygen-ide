/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

// @flow
import React, { Fragment } from 'react';
import { Icon } from 'antd';

import MonacoEditor from '../../components/MonacoEditor/index.jsx';
import '../../css/editor.scss';

import editorSubjects from '../../store/editor/subjects';
import fileSubjects from '../../store/fs/subjects';
type Props = {
  waitUpdateBreakpoints: boolean,
  editorReadOnly: boolean,
  activeFileName: string | null,
  fontSize: number,
  activeFile: null | object,
  openFiles: null | {[key: string]: Object},
  onBreakpointsUpdate: (Array<any>) => void,
  onContentUpdate: (string, string) => void,
  handleMainMenuEvent: Function,
  testSelected: Object,
  testEvents: Array
};

const getSelected = (testEvents, testSelected) => {
    let result = null;

    if (testEvents && Array.isArray(testEvents) && testEvents.length > 0 && testSelected && testSelected.type && testSelected.id) {
        testEvents.map((item) => {
            if (testSelected.type === 'suite') {
                if (item.type === 'SUITE_STARTED' && testSelected.id === item.suite.sid) {
                    result = {...item.suite};
                }
                if (item.type === 'SUITE_ENDED' && testSelected.id === item.result.sid) {
                    result = {...item.result};
                }    
            }
            if (testSelected.type === 'case') {
                if (item.type === 'CASE_STARTED' && testSelected.id === item.case.cid) {
                    result = {...item.case};
                }
                if (item.type === 'CASE_ENDED' && testSelected.id === item.result.cid) {
                    result = {...item.result};
                }        
            }
            if (testSelected.type === 'step') {
                if (item.type === 'STEP_STARTED' && testSelected.id === item.step.sid) {
                    result = {...item.step};
                }
                if (item.type === 'STEP_ENDED' && testSelected.id === item.result.sid) {
                    result = {...item.result};
                }
            }
        });
    }

    return result;
};

export default class TextEditor extends React.Component<Props> {
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
        this.lastTrigger = null;
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

        if (editor && editor.editor) {
            editor.editor.focus();
        }

        if (this.lastTrigger && typeof this.lastTrigger === 'string' && ['find', 'replace'].includes(this.lastTrigger)) {
            try {
                const closeTriggerLine = 'closeFindWidget';
                if (editor) {
                    editor.trigger(closeTriggerLine);
                }
                this.lastTrigger = null;
            } catch (e) {
                console.log('lastTrigger e', e);
            }
        }

        if (editor && typeof editor.trigger === 'function') {
            editor.trigger(trigger);
            this.lastTrigger = trigger;
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

    onBreakpointsUpdate = (filePath, bps, fileName) => {
        this.props.onBreakpointsUpdate(filePath, bps, fileName);
    }

    handleValueChange = (filePath, value, name) => {
        this.props.onContentUpdate(filePath, value, name);
    }

    handleSelectionChange = (filePath, selectedText) => {
        // TODO: add here handler for selection-related actions
    }

    render() {
        const {
            testSelected,
            testEvents,
            fontSize
        } = this.props;

        const selected = getSelected(testEvents, testSelected);

        let screenshot;

        if (selected && selected.screenshot) {
            screenshot = `${selected.screenshot}`;
            delete selected.screenshot;
        } else {
            screenshot = null;
        }

        return (
            <Fragment>
                { 
                    selected && screenshot &&
                    <div style={{ height: '100%', width: '100%' }}>
                        <div style={{ height: '50%', width: '100%' }}>
                            <MonacoEditor
                                value={JSON.stringify(selected, null, 2)}
                                language={'json'}
                                editorReadOnly={true}
                                fontSize={fontSize}
                                handleMainMenuEvent={this.props.handleMainMenuEvent}
                                breakpoints={[]}
                                disabledBreakpoints={[]}
                                resolvedBreakpoints={[]}   
                            />
                        </div>
                        <div style={{ height: '50%', width: '100%' }}>
                            <img style={{ width: '100%', height: 'auto', display: 'block'}} src={`data:image/png;base64,${screenshot}`}/>
                        </div>
                    </div>
                }
                { 
                    selected && !screenshot &&
                    <MonacoEditor
                        value={JSON.stringify(selected, null, 2)}
                        language={'json'}
                        editorReadOnly={true}
                        fontSize={fontSize}
                        handleMainMenuEvent={this.props.handleMainMenuEvent}
                        breakpoints={[]}
                        disabledBreakpoints={[]}
                        resolvedBreakpoints={[]}   
                    />
                }
                {
                    !selected && 
                    <div className="noFilesPlaceholder">
                        <div>
                            <Icon type="inbox" />
                            <p>You have no active selected item</p>
                        </div>
                    </div>
                }
            </Fragment>
        );
    }
}

