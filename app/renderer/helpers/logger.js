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
    const prefix = (args) => { args[0] = '[R] ' + args[0]; };
    global.log.info = (...args) => { prefix(args); return _log.info.apply(global.log, args); };
    global.log.warn = (...args) => { prefix(args); return _log.warn.apply(global.log, args); };
    global.log.error = (...args) => { prefix(args); return _log.error.apply(global.log, args); };
    global.log.debug = (...args) => { prefix(args); return _log.debug.apply(global.log, args); };

    process.on('uncaughtException', error => {
        // ignore Monaco Editor error related to jsonMode.js
        if (error.message && error.name && error.name === 'ReferenceError' && error.message === 'exports is not defined') {
            console.warn(`Ignoring error: ${error.name}: ${error.message}`);
            return;
        }

        // ignore Monaco Editor error related to doResolve
        if(error && error.message && typeof error.message === 'string' && error.message.includes('doResolve')){
            return;
        }

        global.log.error('Unhandled Error.', util.inspect(error));
    });

    process.on('unhandledRejection', error => {
        global.log.warn('Unhandled Promise Rejection.', util.inspect(error));
    });
}
