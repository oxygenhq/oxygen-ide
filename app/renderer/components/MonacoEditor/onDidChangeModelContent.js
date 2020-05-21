/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as helpers from './helpers';
/**
   * Emit touched current file
   * Handle changed empty lines with active breakpoints
   */
export default function onDidChangeModelContent (e) {
    const { editorClasses } = this.state;
    const editor = this.editor;

    if (this.__prevent_trigger_change_event) {
        return;
    }

    // identify if user has added or removed a line - if the number of lines hasn't change, then we have nothing to do here
    const newLineAddedOrDeleted = e.changes.some(change => ( change.text === e.eol || (change && change.range && change.range.startLineNumber != change.range.endLineNumber) ));
    
    const editorContent = editor.getModel().getValue();
    // Always refer to the latest value
    this.__current_value = editorContent;
    
    // Only invoking when user input changed
    if (!this.__prevent_trigger_change_event) {
        this.onValueChange(editorContent, e);
    }

    if (newLineAddedOrDeleted) {
        const currentLength = editorContent.split('\n').length;
        let newEditorClasses = [];
    
        if (currentLength > 999 && !editorClasses.includes('extendedMarginEditor')) {
        //newEditorClasses = editorClass.split(' ');
            newEditorClasses = [
                ...editorClasses,
                'extendedMarginEditor',
            ];
            this.setState({
                editorClasses: newEditorClasses,
            });
        } else if (currentLength < 1000 && editorClasses.includes('extendedMarginEditor')) {
        //newEditorClasses = editorClass.split(' ');
            newEditorClasses = editorClasses
                .filter((item) => item !== 'extendedMarginEditor');
            this.setState({ editorClasses: newEditorClasses });
        }
            
        const breakpoints = helpers.breakpointMarkersToLineNumbers(this.editor);
        
        this.onBreakpointsUpdate(breakpoints);
    }
}
