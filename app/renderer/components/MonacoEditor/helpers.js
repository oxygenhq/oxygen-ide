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

export function addBreakpointMarker(editor, line) {
    // check if this line already has breakpoint marker
    if (getBreakpointMarker(editor, line)) {
      return false;
    }
    const columnNum = editor.getModel().getLineFirstNonWhitespaceColumn(line);
    const newset = editor.deltaDecorations(
      [], [{
        range: new monaco.Range(line, columnNum, line, columnNum + 1),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          linesDecorationsClassName: 'breakpointStyle',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        }
      }]);
    return newset;
}

export function removeBreakpointMarker(editor, lineOrMarker) {
    const allMarkers = getAllMarkers(editor);
    // lineOrMarker parameter can either be a line number (integer) or a reference to decorator object
    const markerToRemove = (typeof lineOrMarker === 'object') ? lineOrMarker : getBreakpointMarker(editor, lineOrMarker);
    // if breakpoint marker wasn't found at the provided line, then return null
    if (!markerToRemove) {
        return null;
    }
    const remainingMarkers = allMarkers.filter(marker => marker.id !== markerToRemove.id);
    return editor.deltaDecorations(
      //allMarkers, remainingMarkers
      decoratorsToFlat(allMarkers), remainingMarkers
    );
    return retval;
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

export function updateActiveLine(editor, line) {
    // line value can be null, if we want to remove the active cursor completely - handle this accordingly
    const updatedLineDecorator = Number.isInteger(line) ? {
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: 'myContentClass',
          linesDecorationsClassName: 'currentLineDecoratorStyle',
          someCustomProp: true,
        }
    } : null;
    // build new decorators array, excluding the previous active line marker and including the new one with the update line number
    const allMarkers = getAllMarkers(editor);
    const newDecoratorsArray = [
        ...allMarkers.filter((item) => item.options.linesDecorationsClassName !== 'currentLineDecoratorStyle'),
    ];
    if (updatedLineDecorator) {
        newDecoratorsArray.push(updatedLineDecorator);
    }
    // call Monaco to update the decorators
    editor.deltaDecorations(
        decoratorsToFlat(allMarkers),
        newDecoratorsArray
    );
}
