/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export function getMarkerLine(marker) {
    return marker.range.startLineNumber;
}
/**
   * @param  {Object} item
   * Determines if the specified marker represents a breakpoint
*/
export function isBreakpointMarker(marker) {
    return marker.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1;
}

/**
   * @returns {Array} of decorators
*/
export function  getAllMarkers(editor) {
    return editor.getModel().getAllDecorations();
}

/**
   * @returns {Array} of decorators
*/
export function  getBreakpointMarkers(editor) {
    return editor.getModel().getAllDecorations().filter( marker => isBreakpointMarker(marker));
}

export function addBreakpointMarker(editor, line, fontSize=null) {
    // check if this line already has breakpoint marker
    if (!fontSize && getBreakpointMarker(editor, line)) {
      return false;
    }
    const columnNum = editor.getModel().getLineFirstNonWhitespaceColumn(line);

    let fontSizeClassName = '';

    if(fontSize && Number.isInteger(fontSize)){
        fontSizeClassName = 'breakpointStyle'+fontSize;
    }

    const newDecorators = [{
        range: new monaco.Range(line, columnNum, line, columnNum),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          linesDecorationsClassName: 'breakpointStyle '+fontSizeClassName,
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    const allMarkers = getAllMarkers(editor);
    
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => item.range.endLineNumber === line && item.options.linesDecorationsClassName.startsWith('breakpointStyle') && !item.options.linesDecorationsClassName.endsWith(fontSizeClassName)),
    ];

    return editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

export function removeBreakpointMarker(editor, lineOrMarker) {
    // lineOrMarker parameter can either be a line number (integer) or a reference to decorator object
    const markerToRemove = (typeof lineOrMarker === 'object') ? lineOrMarker : getBreakpointMarker(editor, lineOrMarker);
    // if breakpoint marker wasn't found at the provided line, then return null
    if (!markerToRemove) {
        return null;
    }

    return editor.deltaDecorations([markerToRemove.id], []);
}

export function getBreakpointMarker(editor, line) {
    let firstMatch = getAllMarkers(editor).find((marker) => {
      // return the first marker that matches
      return isBreakpointMarker(marker) && marker.range.startLineNumber === line;
    });
    return firstMatch || null;
}

/**
   * @param  {Array<Decorator>} decorators
   * @returns {Array<string>} of id's of decorators
   * Converts an array of Decorators to a flat array of decorator ids (string array)
*/
export function decoratorsToFlat (decorators) {
    let newArr = [];
    if (!decorators) {
      return newArr;
    }
    decorators.forEach((decorator) => {
      newArr = [...newArr, decorator.id];
    });

    return newArr;
}

export function breakpointMarkersToLineNumbers(editor) {
    const bpMarkers = getBreakpointMarkers(editor);
    return bpMarkers.map(bpMarker => getMarkerLine(bpMarker));
}

export function updateActiveLineMarker(editor, line, fontSize=null) {    
    try{
        // try to convert string value of line to number if possible (line support to be integer)
        if (line && !Number.isInteger(line) && typeof line === 'string' && !isNaN(line)) {
            try { line = parseInt(line); }
            // ignore this call if line is not null and not a number
            catch (e) { return; }
        }
        const columnNum = Number.isInteger(line) ? editor.getModel().getLineFirstNonWhitespaceColumn(line) : null;
        // line value can be null, if we want to remove the active cursor completely
        
        let fontSizeClassName = '';

        if(fontSize && Number.isInteger(fontSize)){
            fontSizeClassName = 'currentLineDecoratorStyle'+fontSize;
        }
        
        const updatedLineDecorator = Number.isInteger(line) ? {
            range: new monaco.Range(line, columnNum, line, columnNum),
            options: {
            isWholeLine: true,
            className: 'myContentClass',
            linesDecorationsClassName: 'currentLineDecoratorStyle '+fontSizeClassName
            }
        } : null;

        const allMarkers = getAllMarkers(editor);
        
        const decoratorsToRemove = [
            ...allMarkers.filter((item) => item.options.linesDecorationsClassName.startsWith('currentLineDecoratorStyle')),
        ];

        const newDecorators = [];
        if (updatedLineDecorator) {
            newDecorators.push(updatedLineDecorator);
        }

        editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
    } catch(e){
        console.error('err', e);
    }
}
