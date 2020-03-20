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
    try{
        if(
            marker && 
            marker.options &&
            marker.options.linesDecorationsClassName &&
            typeof marker.options.linesDecorationsClassName === 'string'
        ){
            return marker.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1;
        } else {
            return false;
        }
    } catch(e){
        console.log('isBreakpointMarker error', e);
    }
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
export function getBreakpointMarkers(editor) {
    return editor.getModel().getAllDecorations().filter( marker => isBreakpointMarker(marker));
}

export function addBreakpointMarker(editor, line, fontSize=null, disabledBreakpoints, resolvedBreakpoints) {
    try{
        // check if this line already has breakpoint marker
        if (!fontSize && getBreakpointMarker(editor, line)) {
            return false;
        }
        const columnNum = editor.getModel().getLineFirstNonWhitespaceColumn(line);
    
        let fontSizeClassName = '';
    
        if(fontSize && Number.isInteger(fontSize)){
            fontSizeClassName = 'breakpointStyle'+fontSize;
        }

        if(
            disabledBreakpoints &&
            Array.isArray(disabledBreakpoints) &&
            disabledBreakpoints.includes(line)
        ){
            fontSizeClassName += ' hollowCircle';
        }
        
        if(
            resolvedBreakpoints &&
            Array.isArray(resolvedBreakpoints) &&
            resolvedBreakpoints.includes(line)
        ){
            fontSizeClassName += ' resolwedCircle';
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
            ...allMarkers.filter((item) => {
                if(
                    item &&
                    item.range &&
                    item.range.endLineNumber && 
                    item.range.endLineNumber === line &&
                    item.options &&
                    item.options.linesDecorationsClassName &&
                    typeof item.options.linesDecorationsClassName === 'string' &&
                    !item.options.linesDecorationsClassName.endsWith(fontSizeClassName) &&
                    !item.options.linesDecorationsClassName.includes('currentLineDecoratorStyle')
                ){
                    return true;
                } else {
                    return false;
                }
            })
        ];
        return editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
    } catch(e){
        console.log('addBreakpointMarker error', e);
    }
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

function addHalfOpacity(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ){
                return true;
            } else {
                return false;
            }
        })
    ];

    const newDecorators = [{
        range: new monaco.Range(marker.range.startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' halfOpacity',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeHalfOpacity(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ){
                return true;
            } else {
                return false;
            }
        })
    ];

    const newLinesDecorationsClassName = marker.options.linesDecorationsClassName.replace(/ halfOpacity/g, '');

    const newDecorators = [{
        range: new monaco.Range(marker.range.startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: newLinesDecorationsClassName,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function addHollowCircle(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ){
                return true;
            } else {
                return false;
            }
        })
    ];

    const newDecorators = [{
        range: new monaco.Range(marker.range.startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' hollowCircle',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeHollowCircle(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ){
                return true;
            } else {
                return false;
            }
        })
    ];

    const newLinesDecorationsClassName = marker.options.linesDecorationsClassName.replace(/ hollowCircle/g, '');
    
    const newDecorators = [{
        range: new monaco.Range(marker.range.startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: newLinesDecorationsClassName,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function addResolwedCircle(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ){
                return true;
            } else {
                return false;
            }
        })
    ];

    const newDecorators = [{
        range: new monaco.Range(marker.range.startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' resolwedCircle',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeResolwedCircle(marker, editor){
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if(
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > - 1&&
                item.options.linesDecorationsClassName.includes('resolwedCircle')
            ){
                return true;
            } else {
                return false;
            }
        })
    ];
    
    const newDecorators = [];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

export function makeBreakpointsHalfOpacity(editor) {
    const bpMarkers = getBreakpointMarkers(editor);
    return bpMarkers.map(bpMarker => addHalfOpacity(bpMarker, editor));
}

export function makeBreakpointsFullOpacity(editor) {
    const bpMarkers = getBreakpointMarkers(editor);
    return bpMarkers.map(bpMarker => removeHalfOpacity(bpMarker, editor));
}

export function makeBreakpointsHollowCircle(editor, disabledBreakpoints){
    const bpMarkers = getBreakpointMarkers(editor);
    
    return bpMarkers.map(bpMarker => {
        if(
            bpMarker &&
            bpMarker.range &&
            bpMarker.range.startLineNumber &&
            disabledBreakpoints &&
            Array.isArray(disabledBreakpoints) &&
            disabledBreakpoints.includes(bpMarker.range.startLineNumber)
        ){
            addHollowCircle(bpMarker, editor);
        } else {
            removeHollowCircle(bpMarker, editor);
        }
    });

}

export function makeBreakpointsResolwedCircle(editor, resolvedBreakpoints){
    const bpMarkers = getBreakpointMarkers(editor);
    
    return bpMarkers.map(bpMarker => {
        if(
            bpMarker &&
            bpMarker.range &&
            bpMarker.range.startLineNumber &&
            resolvedBreakpoints &&
            Array.isArray(resolvedBreakpoints) &&
            resolvedBreakpoints.includes(bpMarker.range.startLineNumber)
        ){
            addResolwedCircle(bpMarker, editor);
        } else {
            removeResolwedCircle(bpMarker, editor);
        }
    });
}

export function updateActiveLineMarker(editor, inputLine, fontSize=null) {
    try{
        let line = inputLine;
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
            ...allMarkers.filter((item) => {
                if(
                    item &&
                    item.options && 
                    item.options.linesDecorationsClassName &&
                    typeof item.options.linesDecorationsClassName === 'string'
                ){
                    return item.options.linesDecorationsClassName.startsWith('currentLineDecoratorStyle');  
                } else {
                    return false;
                }
            }),
        ];

        const newDecorators = [];
        if (updatedLineDecorator) {
            newDecorators.push(updatedLineDecorator);
        }

        editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
    } catch(e){
        console.log('updateActiveLineMarker Error', e);
    }
}
