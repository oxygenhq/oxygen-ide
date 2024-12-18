/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';

export function getMarkerLine(marker) {
    let result = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        result = marker.range.startLineNumber;
    }
    return result;
}
/**
   * @param  {Object} item
   * Determines if the specified marker represents a breakpoint
*/
export function isBreakpointMarker(marker) {
    try {
        if (
            marker && 
            marker.options &&
            marker.options.linesDecorationsClassName &&
            typeof marker.options.linesDecorationsClassName === 'string'
        ) {
            return marker.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1;
        } else {
            return false;
        }
    } catch (e) {
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
    const decorators = editor.getModel().getAllDecorations();

    const retVal = decorators.filter( marker => {
        return isBreakpointMarker(marker);
    });

    return retVal;
}

export function addBreakpointMarker(editor, line, fontSize=null, disabledBreakpoints, resolvedBreakpoints) {
    try {
        // check if this line already has breakpoint marker
        if (!fontSize && getBreakpointMarker(editor, line)) {
            return false;
        }
        const columnNum = editor.getModel().getLineFirstNonWhitespaceColumn(line);
    
        let fontSizeClassName = '';
    
        if (fontSize && Number.isInteger(fontSize)) {
            fontSizeClassName = 'breakpointStyle'+fontSize;
        }

        if (
            disabledBreakpoints &&
            Array.isArray(disabledBreakpoints) &&
            disabledBreakpoints.includes(line)
        ) {
            fontSizeClassName += ' hollowCircle';
        }
        
        if (
            resolvedBreakpoints &&
            Array.isArray(resolvedBreakpoints) &&
            resolvedBreakpoints.includes(line)
        ) {
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
                if (
                    item &&
                    item.range &&
                    item.range.endLineNumber && 
                    item.range.endLineNumber === line &&
                    item.options &&
                    item.options.linesDecorationsClassName &&
                    typeof item.options.linesDecorationsClassName === 'string' &&
                    !item.options.linesDecorationsClassName.endsWith(fontSizeClassName) &&
                    !item.options.linesDecorationsClassName.includes('currentLineDecoratorStyle')
                ) {
                    return true;
                } else {
                    return false;
                }
            })
        ];
        return editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
    } catch (e) {
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
        let result = 
            isBreakpointMarker(marker) && 
            marker && 
            marker.range &&
            marker.range.startLineNumber &&
            marker.range.startLineNumber === line;
        

        return result;
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

function addHalfOpacity(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ) {
                return true;
            } else {
                return false;
            }
        })
    ];

    let startLineNumber = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        startLineNumber = marker.range.startLineNumber;
    }

    const newDecorators = [{
        range: new monaco.Range(startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' halfOpacity',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeHalfOpacity(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ) {
                return true;
            } else {
                return false;
            }
        })
    ];

    const newLinesDecorationsClassName = marker.options.linesDecorationsClassName.replace(/ halfOpacity/g, '');

    let startLineNumber = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        startLineNumber = marker.range.startLineNumber;
    }

    const newDecorators = [{
        range: new monaco.Range(startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: newLinesDecorationsClassName,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function addHollowCircle(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ) {
                return true;
            } else {
                return false;
            }
        })
    ];

    let startLineNumber = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        startLineNumber = marker.range.startLineNumber;
    }

    const newDecorators = [{
        range: new monaco.Range(startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' hollowCircle',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeHollowCircle(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ) {
                return true;
            } else {
                return false;
            }
        })
    ];

    const newLinesDecorationsClassName = marker.options.linesDecorationsClassName.replace(/ hollowCircle/g, '');
    
    let startLineNumber = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        startLineNumber = marker.range.startLineNumber;
    }
    
    const newDecorators = [{
        range: new monaco.Range(startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: newLinesDecorationsClassName,
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function addResolwedCircle(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > -1
            ) {
                return true;
            } else {
                return false;
            }
        })
    ];

    let startLineNumber = 0;

    if (
        marker &&
        marker.range &&
        marker.range.startLineNumber
    ) {
        startLineNumber = marker.range.startLineNumber;
    }
    

    const newDecorators = [{
        range: new monaco.Range(startLineNumber, marker.range.startColumn, marker.range.endLineNumber, marker.range.endColumn),
        options: {
            isWholeLine: true,
            className: marker.options.className,
            linesDecorationsClassName: marker.options.linesDecorationsClassName+' resolwedCircle',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        }
    }];
    
    editor.deltaDecorations(decoratorsToFlat(decoratorsToRemove), newDecorators);
}

function removeResolwedCircle(marker, editor) {
    const allMarkers = getAllMarkers(editor);
        
    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.range &&
                item.range.endLineNumber && 
                item.range.endLineNumber === marker.range.endLineNumber &&
                item.options &&
                item.options.linesDecorationsClassName &&
                typeof item.options.linesDecorationsClassName === 'string' &&
                item.options.linesDecorationsClassName.indexOf('breakpointStyle') > - 1&&
                item.options.linesDecorationsClassName.includes('resolwedCircle')
            ) {
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

export function makeBreakpointsHollowCircle(editor, disabledBreakpoints) {
    const bpMarkers = getBreakpointMarkers(editor);
    
    return bpMarkers.map(bpMarker => {
        if (
            bpMarker &&
            bpMarker.range &&
            bpMarker.range.startLineNumber &&
            disabledBreakpoints &&
            Array.isArray(disabledBreakpoints) &&
            disabledBreakpoints.includes(bpMarker.range.startLineNumber)
        ) {
            addHollowCircle(bpMarker, editor);
        } else {
            removeHollowCircle(bpMarker, editor);
        }
    });

}

export function makeBreakpointsResolwedCircle(editor, resolvedBreakpoints) {
    const bpMarkers = getBreakpointMarkers(editor);
    
    return bpMarkers.map(bpMarker => {
        if (
            bpMarker &&
            bpMarker.range &&
            bpMarker.range.startLineNumber &&
            resolvedBreakpoints &&
            Array.isArray(resolvedBreakpoints) &&
            resolvedBreakpoints.includes(bpMarker.range.startLineNumber)
        ) {
            addResolwedCircle(bpMarker, editor);
        } else {
            removeResolwedCircle(bpMarker, editor);
        }
    });
}

export function updateActiveLineMarker(editor, inputLine, fontSize=null) {
    try {
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

        if (fontSize && Number.isInteger(fontSize)) {
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
                if (
                    item &&
                    item.options && 
                    item.options.linesDecorationsClassName &&
                    typeof item.options.linesDecorationsClassName === 'string'
                ) {
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
    } catch (e) {
        console.log('updateActiveLineMarker Error', e);
    }
}

const PARAM_DECORATION_CLASS_NAME = 'paramDecoration';

export function markParams (editor, value) {
    if (!value) {
        return;
    }

    const splitResult = value.split('\n');

    const regex1 = /('|")(.*)('|")/; // for ', ""
    const regex2 = /\$\{[a-zA-Z]+?}/g; // for ${}
    var decorations = [];

    const allMarkers = getAllMarkers(editor);

    const decoratorsToRemove = [
        ...allMarkers.filter((item) => {
            if (
                item &&
                item.options && 
                item.options.inlineClassName &&
                typeof item.options.inlineClassName === 'string'
            ) {
                return item.options.inlineClassName === PARAM_DECORATION_CLASS_NAME;  
            } else {
                return false;
            }
        }),
    ];

    if (splitResult && splitResult.length > 0) {
        splitResult.map((inputItem, idx) => {
            let item = inputItem;
            const result = regex1.exec(item);
            if (result && result[2]) {
                const paramsString = result[2];
                const params = paramsString.match(regex2); 
                if (params && params.length > 0) {
                    params.map((param) => {
                        const indexOf = item.indexOf(param);
                        const replaceSrt = new Array(param.length + 1).join( ' ' );
                        item = item.replace(param, replaceSrt);                      
    
                        const start = indexOf + 3;
                        const line = idx + 1;
                        const end = start + param.length - 3;
        
                        decorations.push({
                            range: new monaco.Range(line,start,line,end),
                            options: {
                                inlineClassName: PARAM_DECORATION_CLASS_NAME
                            }
                        });
                    });
                }

            }

        });
    }

    if (editor) {
        editor.deltaDecorations(decoratorsToRemove, decorations);
    }
}
