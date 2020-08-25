/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { remote } from 'electron';
import util from 'util';

export default function loggerSetup() {
    var _log = remote.getGlobal('log');

    // prefix messages so we know they came from renderer process
    global.log = {};

    const prefix = (args) => { 
        let monacoError = false;
        if (args && Array.isArray(args) && args.length > 0) {
            args.map((arg) => {
                if (arg && arg.includes) {
                    if (arg.includes('monaco-editor')) {
                        monacoError = true;
                    }
                }
            });
        }

        args[0] = '[R]' + args[0];
        
        return monacoError;
    };

    global.log.info = (...args) => { const monacoError = prefix(args); if (!monacoError) { return _log.info.apply(global.log, args); } };
    global.log.warn = (...args) => { const monacoError = prefix(args); if (!monacoError) { return _log.warn.apply(global.log, args); } };
    global.log.error = (...args) => { const monacoError = prefix(args); if (!monacoError) { return _log.error.apply(global.log, args); } else { return _log.info.apply(global.log, [util.inspect(args)]); } };
    global.log.debug = (...args) => { const monacoError = prefix(args); if (!monacoError) { return _log.debug.apply(global.log, args); } };

    process.on('uncaughtException', error => {
        // ignore Monaco Editor error related to jsonMode.js
        if (error.message && error.name && error.name === 'ReferenceError' && error.message === 'exports is not defined') {
            console.warn(`Ignoring error: ${error.name}: ${error.message}`);
            return;
        }

        // ignore Monaco Editor error related to doResolve
        if (error && error.message && typeof error.message === 'string' && error.message.includes('doResolve')) {
            return;
        }

        global.log.error('Unhandled Error.', util.inspect(error));
    });

    process.on('unhandledRejection', error => {
        global.log.warn('Unhandled Promise Rejection.', util.inspect(error));
    });
}
