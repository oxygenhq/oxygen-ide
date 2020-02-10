/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { app, dialog } from 'electron';
let winston = require('winston');
let DailyRotateFile = require('winston-daily-rotate-file');
winston.transports.DailyRotateFile = DailyRotateFile;
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

const format = winston.format((info, ops) => {
    const result = moment().format('YYYY-MM-DD HH:mm:ss') + ' '
        + (info.message ? info.message : '')
        + (info.meta && Object.keys(info.meta).length ? '\n\t' + util.inspect(info.meta) : '');

    return {
        message: result,
        level: info.level.toUpperCase()
    };
});    

export default class Logger {
    constructor(levelConsole, levelFile) {

        this.logFileName = 'oxygenide-%DATE%.log';
        
        try {
            this.logsPath = app.getPath('logs');
            this.logFilePath = path.resolve(app.getPath('logs'), this.logFileName);
        } catch (err) {
            // getPath('logs') fails on linux
            const logsPath = path.join(app.getPath('userData'), 'logs');
            if (!fs.existsSync(app.getPath('userData'))) {
                fs.mkdirSync(app.getPath('userData'));
            }
            if (!fs.existsSync(logsPath)) {
                fs.mkdirSync(logsPath);
            }
            this.logsPath = logsPath;
            this.logFilePath = path.resolve(logsPath, this.logFileName);

            if(err && err.message && err.message === "Failed to get 'logs' path"){
                //ignore
            } else {
                if(Sentry && Sentry.captureException){
                    Sentry.captureException(err);
                }
            }
        }
        
        const currentLogFileName = this.getLogFileName();
        console.log('Logs folder :', this.logsPath);
        console.log('Current log file :', currentLogFileName);
        
        const transport = new (winston.transports.DailyRotateFile)({
            filename: this.logFilePath,
            date_format: null,
            zippedArchive: false,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                format(),
                winston.format.simple(),
            )
        });
        
        transport.on('rotate', function(oldFilename, newFilename) {
            // do something if need
        });

        var transConsole = new (winston.transports.Console)({
            level: levelConsole,
            json: false,
            prettyPrint: true,
            timestamp: () => moment().format('HH:mm:ss'),
            format: winston.format.combine(
                winston.format.colorize(),
                format(),
                winston.format.simple()
            )
        });

        var _log = winston.createLogger({
            transports: [transport, transConsole]
        });

        this._overrideLog(_log);
        this._overrideConsole(_log);
        this._catchTheUncaught();
        const lastLogFilePath = this.getLogFilePath();
        console.log('Logs file location :', lastLogFilePath);
    }

    getLogFilePath(){
        const currentLogFileName = this.getLogFileName();
        const lastLogFilePath = path.resolve(this.logsPath, currentLogFileName);
        return lastLogFilePath;
    }

    getLogFileName(){
        const dateFormat = 'YYYY-MM-DD';
        const dateStr = moment().local().format(dateFormat);
        return this.logFileName.replace(/%DATE%/g, dateStr);
    }

    _overrideConsole(_log) {
        const formatArgs = (args) => {
            const result = [util.format.apply(util.format, Array.prototype.slice.call(args))];   
            return result;
        };

        console.log = function(){
            const log = _log.info.bind(_log);
            return log.apply(_log, formatArgs(arguments));
        };

        console.info = function(){
            const log = _log.info.bind(_log);
            return log.apply(_log, formatArgs(arguments));
        };

        console.warn = function(){
            const log = _log.warn.bind(_log);
            return log.apply(log, formatArgs(arguments));
        };
        
        console.error = function(){
            const log = _log.error.bind(_log);
            return log.apply(log, formatArgs(arguments));
        };

        console.debug = function(){
            const log = _log.debug.bind(_log);
            return log.apply(log, formatArgs(arguments));
        };
    }

    _overrideLog(_log) {
        const showDialog = (msg, inputErr, type) => {
            let err = inputErr;
            if (!err) {
                err = '';
            }

            const detail = err.toString()
                          + '\n\nFull log is available at: ' + this.logFilePath;

                
            if(Sentry && Sentry.captureException){                
                const error = new Error(msg);

                Sentry.captureException(error);
            } else {
                console.log('bad Sentry', Sentry);
            }

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
            const log = _log.info.bind(_log);
            return log.apply(log, args);
        };
        this.debug = (...args) => {
            prepError(args);
            const log = _log.debug.bind(_log);
            return log.apply(log, args);
        };
        this.error = (...args) => {
            // do not show errors to the user about deprecated Buffer()
            if (args[0] && args[0].includes('DeprecationWarning: Buffer() is deprecated')) {
                return ret;
            }
            prepError(args);
            const log = _log.error.bind(_log);
            const ret = _log.apply(log, args);
            showDialog(args[0], args.length === 2 ? args[1] : '', 'error');
            return ret;
        };
        this.warn = (...args) => {
            prepError(args);
            const log = _log.warn.bind(_log);
            const ret = log.apply(log, args);
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

            console.warn('Unhandled Error.', error);
        });

        process.on('unhandledRejection', error => {
            console.warn('Unhandled Promise Rejection.', error);
        });
    }
}
