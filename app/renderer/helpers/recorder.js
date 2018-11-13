/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export function toOxygenCode(steps) {
    let codeLines = [];
    for (var step of steps) {
        const { module = 'web', cmd, target, value, locators } = step;

        // if more than a single target is specified, then add all alternative locators as commented out lines
        if (locators) {
            const pad = '                ';
            for (var loc of locators) {
                const locType = (pad + loc[1]).slice(-pad.length);
                codeLines.push('// ' + locType + ': ' + loc[0].replace(/'/g, "\\'"));
            }
        }

        // compose Oxygen method's arguments string:

        // compose 'target' argument
        var args = target ? "'" + target.replace(/'/g, "\\'") + "'" : '';

        // compose 'value' argument
        if (value || value === '') {
            if (/\r|\n/.exec(value)) {   // multiline text should be wrapped within backticks
                args += ', `' + value + '`';
            } else {
                if (value.toFixed) { // don't enclose in quotes if number
                    args += ', ' + value; 
                } else {
                    args += ", '" + value.replace(/'/g, "\\'") + "'"; 
                }
            }
        }
        
        // add to the line list
        codeLines.push(`${module}.${cmd}(${args});\n`);
    }
    return codeLines.join('\n');
}
