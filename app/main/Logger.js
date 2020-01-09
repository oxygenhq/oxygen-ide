/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { app, dialog } from 'electron';
import winston from 'winston';
import { default as cleanStack } from 'clean-stack';
import moment from 'moment';
import util from 'util';
import path from 'path';
import fs from 'fs';
import * as Sentry from '@sentry/electron';

/*
Following is a description of how log.* and console.* commands work and what effect do they have on 
the end user.
This relates both Main process and Render process.

TL;DR; Use console.error and log.error with caution since they generate error dialog.
       This is on purpose, to make sure user is knowns that the application is in unstable state 
       even if it didn't crash.

Main process:
-------------
- console.error() and log.error() will show a dialog with error to the user
- console.warn() and log.warn() will show a dialog with the error to the user only in DEV mode (npm run dev)
- Unhandled exception will produce an error dialog
- Unhandled promise rejections will produce an error dialog only in DEV mode.
- All console.* methods wrtie to logs.

Render process:
---------------
- log.error() will show a dialog with error to the user
- log.warn() will show a dialog with the error to the user only in DEV mode (npm run dev)
- Unhandled exceptions will produce an error dialog
- Unhandled promise rejections will produce an error dialog only in DEV mode.
- console.* methods including console.error and console.warn *DO NOT* write to logs yet (this will probably change)
*/

export default class Logger {
    constructor(levelConsole, levelFile) {
        try {
            this.logFilePath = path.resolve(app.getPath('logs'), 'oxygenide.log');
        } catch (err) {
            // getPath('logs') fails on linux
            const logsPath = path.join(app.getPath('userData'), 'logs');
            if (!fs.existsSync(app.getPath('userData'))) {
                fs.mkdirSync(app.getPath('userData'));
            }
            if (!fs.existsSync(logsPath)) {
                fs.mkdirSync(logsPath);
            }
            this.logFilePath = path.resolve(logsPath, 'oxygenide.log');

            if(Sentry && Sentry.captureException){
                Sentry.captureException(err);
            }
        }
        
        console.log('Log File Path : ', this.logFilePath);

        var transFile = new (winston.transports.File)({
            filename: this.logFilePath,
            maxSize: 1024*1024*3,
            maxFiles: 10,
            prepend: true,
            colorize: false,
            prettyPrint: true,
            json: false,
            level: levelFile,
            zippedArchive: false,
            timestamp: () => moment().format('YYYY-MM-DD HH:mm:ss'),
            formatter:  function(options) {
                return options.timestamp() + ' '
                    + options.level.toUpperCase() + ' '
                    + (options.message ? options.message : '')
                    + (options.meta && Object.keys(options.meta).length ? '\n\t' + util.inspect(options.meta) : '');
            }
        });

        var transConsole = new (winston.transports.Console)({
            colorize: true,
            level: levelConsole,
            json: false,
            prettyPrint: true,
            timestamp: () => moment().format('HH:mm:ss'),
            formatter: function(options) {
                return options.timestamp() + ' '
                    + winston.config.colorize(options.level, options.level.toUpperCase()) + ' '
                    + (options.message ? options.message : '')
                    + (options.meta && Object.keys(options.meta).length ? '\n\t' + util.inspect(options.meta) : '');
            }
        });

        var _log = new (winston.Logger)({
            transports: [transFile, transConsole]
        });

        this._overrideLog(_log);
        this._overrideConsole();
        this._catchTheUncaught();
    }

    _overrideConsole() {
        const formatArgs = (args) => {
            return [util.format.apply(util.format, Array.prototype.slice.call(args))];
        };
        console.log = (...args) => global.log.info.apply(global.log, formatArgs(args));
        console.info = (...args) => global.log.info.apply(global.log, formatArgs(args));
        console.warn = (...args) => global.log.info.apply(global.log, formatArgs(args));
        console.error = (...args) => global.log.error.apply(global.log, formatArgs(args));
        console.debug = (...args) => global.log.debug.apply(global.log, formatArgs(args));
    }

    _overrideLog(_log) {
        const showDialog = (msg, inputErr, type) => {
            let err = inputErr;
            if (!err) {
                err = '';
            }

            const detail = err.toString()
                          + '\n\nFull log is available at: ' + this.logFilePath;

                
            // if(Sentry && Sentry.captureException){                
            //     const error = new Error(msg);

            //     Sentry.captureException(error);
            // } else {
            //     console.log('bad Sentry', Sentry);
            // }

            if (app.isReady()) {
                dialog.showMessageBox({
                    type: type,
                    buttons: ['OK'],
                    defaultId: 0,
                    noLink: true,
                    message: msg,
                    detail: detail
                });
            } else {
                dialog.showErrorBox(msg, detail);
            }
        };
        const prepError = (args) => {
            if (args.length === 2) {
                if (args[1]) {
                    if (args[1].stack) {
                        args[1].stack = cleanStack(args[1].stack, { pretty: true });
                    }
                    if (args[1].errorStack) {
                        args[1].errorStack = cleanStack(args[1].errorStack, { pretty: true });
                    }
                }
                if (typeof args[1] !== 'string' && !(args[1] instanceof String)) {
                    args[1] = util.inspect(args[1]);
                }
            }
        };

        this.info = (...args) => {
            prepError(args);
            return _log.info.apply(this, args);
        };
        this.debug = (...args) => {
            prepError(args);
            return _log.debug.apply(this, args);
        };
        this.error = (...args) => {
            prepError(args);
            const ret = _log.error.apply(this, args);
            // do not show errors to the user about deprecated Buffer()
            if (args[0] && args[0].includes('DeprecationWarning: Buffer() is deprecated')) {
                return ret;
            }
            showDialog(args[0], args.length === 2 ? args[1] : '', 'error');
            return ret;
        };
        this.warn = (...args) => {
            prepError(args);
            const ret = _log.warn.apply(this, args);
            if (process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true') {
                showDialog(args[0], args.length === 2 ? args[1] : '', 'warning');
            }
            return ret;
        };
    }

    _catchTheUncaught() {
        process.on('uncaughtException', error => {
            // ignore Monaco Editor error related to doResolve
            if(error && error.message && typeof error.message === 'string' && error.message.includes('doResolve')){
                return;
            }

            global.log.warn('Unhandled Error.', error);
        });

        process.on('unhandledRejection', error => {
            global.log.warn('Unhandled Promise Rejection.', error);
        });
    }
}
