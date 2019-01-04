/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { util, Runner } from 'oxygen-cli';
import moment from 'moment';
import cfg from '../config.json';
import ServiceBase from "./ServiceBase";

const { selenium } = cfg;
const oxutil = util;

// Events
const EVENT_LOG_ENTRY = 'LOG_ENTRY';
const EVENT_BREAKPOINT = 'BREAKPOINT';
const EVENT_LINE_UPDATE = 'LINE_UPDATE';
const EVENT_TEST_STARTED = 'TEST_STARTED';
const EVENT_TEST_ENDED = 'TEST_ENDED';

// Severities
const SEVERITY_FATAL = 'FATAL';
const SEVERITY_ERROR = 'ERROR';
const SEVERITY_INFO = 'INFO';

export default class TestRunnerService extends ServiceBase {
    isRunning = false;
    isStopping = false;
    oxRunner = null;
    mainFilePath = null;

    constructor() {
        super();        
    }
    /**
     * @param  {String} scriptFilename | path to script file
     * @param  {Object} toolbarState | toolbar buttons params
     * @param  {Object} mainWindow | renderer window
     */
    async start(mainFilePath, breakpoints, runtimeSettings) {
        if (this.oxRunner) {
            throw Error('Previous test is still running. Stop the previous test before calling "start" method.');
        }
        this.isRunning = true;
        this.isStopping = false;
        this.oxRunner = new Runner();
        this._hookToOxygenEvents();
        // store mainFilePath for later, so when we receive LINE_UPDATE event from Oxygen, 
        // we can bubble it up and include the file name in addition to line number (Oxygen sends only a line number)
        this.mainFilePath = mainFilePath;
        const testConfig = {
            seleniumPort: selenium.port,    // this is default selenium port, found in config file
            dbgPort: TestRunnerService._getRandomPort(),
            ...runtimeSettings,             // selenium port can also come from runtime setttings (over)
        };
        const {
            paramFilePath, 
            paramMode,
            iterations,
            reopenSession,
            dbgPort,
            testMode,
            testTarget,
            seleniumPort,
            stepDelay,
        } = testConfig;
        let testsuite = null;

        try {
            testsuite = await oxutil.generateTestSuiteFromJSFile(mainFilePath, paramFilePath, paramMode);
        }
        catch (e) {
            this._emitLogEvent(SEVERITY_ERROR, `Cannot generate test suite from JS file: ${e.message}`);
            return;
        }
        // set iterations count
        testsuite.testcases[0].iterationCount = iterations;
        // prepare launch options
        const options = {};
        options.debugPort = dbgPort;
        options.debugPortIde = dbgPort;
        options.require = {
            allow: true,
            allowGlobal: true
        };
        options.reopenSession = reopenSession || false;
        
        // prepare module parameters
        const caps = {};
        if (testMode === 'resp') {
            options.mode = 'web';
            caps.browserName = 'chrome';
            caps.version = '*';
            caps['goog:chromeOptions'] = {
                mobileEmulation: {
                deviceName: testTarget
                }
            };
        }
        else if (testMode === 'mob') {
            options.mode = 'mob';
            caps.deviceName = testTarget;
            caps.deviceOS = 'Android';
        }
        else if (testMode === 'web') {
            options.mode = 'web';
            options.seleniumUrl = `http://localhost:${seleniumPort}/wd/hub`;
            options.browserName = testTarget;
            // @FIXME: this option should be exposed in reports settings
            options.screenshots = 'never';
        }

        if (stepDelay) {
            options.delay = stepDelay;
        }
        
        try {
            this._emitLogEvent(SEVERITY_INFO, 'Initializing...');

            await this.oxRunner.init(options);
            this._emitTestStarted();    
            // assign user-set breakpoints
            testsuite.testcases[0].breakpoints = this._convertBreakpointsToOxygenFormat(breakpoints);
            return this.oxRunner.run(testsuite, null, caps).then((result) => {
                // eslint-disable-line
                this._emitTestEnded(result);                        
                // @TODO: update UI elements
                return this.dispose();
            })
            .catch((e) => {
                if (e.line) {
                    this._emitLogEvent(SEVERITY_ERROR, `${e.message} at line ${e.line}`);
                } else {
                    this._emitLogEvent(SEVERITY_ERROR, `ERROR: ${e.message}. ${e.stack || ''}`);
                }
                this._emitLogEvent(SEVERITY_FATAL, 'Test Failed!');
                this._emitTestEnded(null, e);
                return this.dispose();
            });
        } catch (e) {
            // the error at .init stage can be cause by parallel call to .kill() method
            // make sure in case we are in the middle of stopping the test to ignore any error at this stage
            if (!this.isStopping) {
                this._emitLogEvent(SEVERITY_ERROR, 'Test Failed!');
                return this.dispose();
            }            
        }
    }

    async stop() {
        if (this.oxRunner) {
            this.isStopping = true;
            try {
                await this.oxRunner.kill();
                await this.oxRunner.dispose();
            }
            catch (e) {
                // ignore any errors
            }            
            this.oxRunner = null;
            this.isRunning = false;
            this.mainFilePath = null;
            this._emitLogEvent(SEVERITY_INFO, 'Test finished with status --> CANCELED');
        }
    }

    continue() {
        if (this.oxRunner) {
            this.oxRunner.debugContinue();
        }
    }

    async dispose() {
        if (this.oxRunner) {
            await this.oxRunner.dispose();
            this.oxRunner = null;
            this.mainFilePath = null;
            this.isRunning = false;
        }
    }

    static _getRandomPort() {
        const portMin = 1024;
        const portMax = 65535;
        return Math.floor(Math.random() * (portMax - portMin)) + portMin;
    }

    _emitTestStarted() {
        this.notify({
            type: EVENT_TEST_STARTED,
        });
    }

    _emitTestEnded(result, error) {
        this.notify({
            type: EVENT_TEST_ENDED,
            result: result,
            error: error,
        });
    }

    _emitLogEvent(severity, message) {
        this.notify({
            type: EVENT_LOG_ENTRY,
            severity: severity,
            message: message,
        });
    }

    _hookToOxygenEvents() {
        this.oxRunner.on('line-update', (line, stack, time) => {
            // send LINE_UPDATE event for each file in the stack
            if (stack && Array.isArray(stack)) {
                const primaryFile  = stack.length > 0 ? stack[0].file : null;
                for (const call of stack) {
                    this.notify({
                        type: EVENT_LINE_UPDATE,
                        time: time,
                        file: call.file,
                        line: call.line,
                        // determine if this stack call is the top (primary) one in the stack (so we can open the relevant tab)
                        primary: primaryFile === call.file, 
                    });
                }
            }
            else {
                this.notify({
                    type: EVENT_LINE_UPDATE,
                    time: time,
                    file: this.mainFilePath,
                    line: line,
                    primary: true,
                });
            }            
        });

        // @params breakpoint, testcase
        this.oxRunner.on('breakpoint', (breakpoint) => {
            const { lineNumber, fileName } = breakpoint;
            const { getScriptContentLineOffset } = this.oxRunner;
            // if no fileName is received from the debugger (not suppose to happen), assume we are in the main script file
            const editorFile = fileName ? fileName : this.mainFilePath;
            // if we are in the main script file, adjust line number according to script boilerplate offset
            let editorLine = editorFile !== this.mainFilePath ? lineNumber : lineNumber - getScriptContentLineOffset;
            // set event time
            const time = moment.utc().unix();
            // make sure to mark breakpoint line with current line mark
            this.notify({
                type: EVENT_LINE_UPDATE,
                time,
                file: editorFile,
                line: editorLine,
                // alway open the tab (make it active) in which breakpoint occured
                primary: true,
            });
            // notify GUI that we hit a breakpoint
            this.notify({
                type: EVENT_BREAKPOINT,
                time,
                file: editorFile,
                line: editorLine,
            });
        });

        this.oxRunner.on('test-error', (err) => {
            let message = null;
            if (err.type && err.message) {
                message = `${err.type} - ${err.message}`;
            } else if (err.type) {
                message = err.type;
            } else if (err.message) {
                message = err.message; // eslint-disable-line
            }
            if (err.line) {
                message += ` at line ${err.line}`;
            }
            this._emitLogEvent(SEVERITY_ERROR, message);
        });

        this.oxRunner.on('ui-log-add', (level, msg) => {
            this._emitLogEvent(SEVERITY_INFO, `LEVEL: ${level} MSG: ${msg}`);
        });

        this.oxRunner.on('iteration-start', (i) => {
            this._emitLogEvent(SEVERITY_INFO, `Starting iteration #${i}`);
        });

        this.oxRunner.on('iteration-end', (result) => {
            const status = result.status ? result.status.toUpperCase() : 'UNKOWN';
            this._emitLogEvent(SEVERITY_INFO, `Test finished with status --> ${status}`);
        });
    }
    /**
     * Converts IDE used breakpoint structure to Oxygen breakpoint structure
     * Source structure: property-based list of files and per each file an array of lines with active breakpoint.
     * Target structure: an array of objects with the following structure: { file: string, line: number }.
     * @param {Object} breakpoints 
     */
    _convertBreakpointsToOxygenFormat(breakpoints) {
        if (!breakpoints || typeof breakpoints !== 'object') {
            return null;
        }
        let _breakpoints = [];
        for (let filePath of Object.keys(breakpoints)) {
            if (!Array.isArray(breakpoints[filePath])) {
                continue;
            }
            for (let line of breakpoints[filePath]) {
                _breakpoints.push({ file: filePath, line: line });
            }
        }
        return _breakpoints;
    }
}
