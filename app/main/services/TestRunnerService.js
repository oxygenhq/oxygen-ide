/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { util, Runner } from 'oxygen-cli';
import path from 'path';
import moment from 'moment';
import detectPort from 'detect-port';
import ServiceBase from "./ServiceBase";

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
        const filename = path.basename(this.mainFilePath, '.js');
        const testConfig = {
            testName: filename,
            dbgPort: await detectPort(10205),
            ...runtimeSettings,
        };
        const {
            paramFilePath, 
            paramMode,
            iterations,
            reopenSession,
            dbgPort,
            testMode,
            testTarget,
            testProvider,
            seleniumPort,
            stepDelay,
            testName,
        } = testConfig;

        let testsuite = null;

        try {
            testsuite = await oxutil.generateTestSuiteFromJSFile(mainFilePath, paramFilePath, paramMode, true);
        } catch (e) {
            // could get exception only if param file loading fails
            this._emitLogEvent(SEVERITY_ERROR, `Test Failed! Unable to load parameters file: ${e.message}`);
            this._emitTestEnded(null, e);
            this.isRunning = false; // oxygen crashed - nothing to oxRunner.dispose(), so just unset local vars
            this.oxRunner = null;
            return;
        }
        // set iterations count
        testsuite.testcases[0].iterationCount = iterations;
        // prepare launch options and capabilities
        const caps = {};
        const options = {};
        options.debugPortIde = dbgPort;
        options.require = {
            allow: true,
            allowGlobal: true
        };
        options.reopenSession = reopenSession || false;

        // add provider specific options, if cloud provider was selected
        if (testProvider && testProvider.id) {
            switch (testProvider.id) {
                case 'sauceLabs':
                    options.seleniumUrl = testProvider.url;
                    caps.name = testName || null;
                    caps.username = testProvider.username;
                    caps.accessKey = testProvider.accessKey;
                    caps.extendedDebugging = testProvider.extendedDebugging || false;
                    caps.capturePerformance = testProvider.capturePerformance || false;
                case 'testingBot':
                    options.seleniumUrl = testProvider.url;
                    caps.name = testName || null;
                    caps.key = testProvider.key;
                    caps.secret = testProvider.secret;
                case 'lambdaTest':
                    options.seleniumUrl = testProvider.url;
                    options.wdioOpts = {
                        user: testProvider.user,
                        key: testProvider.key
                    };
                    caps.name = testName || null;
                    caps.build = testProvider.build || null;
                    caps.console = testProvider.captureConsole || false;
                    caps.network = testProvider.captureNetwork || false;
                    caps.visual = testProvider.takeScreenshots || false;
                    caps.video = testProvider.videoRecording || false;
            }
        }
                
        // prepare module parameters
        if (testMode === 'resp') {
            options.mode = 'web';
            caps.browserName = 'chrome';
            caps['goog:chromeOptions'] = {
                mobileEmulation: {
                    deviceName: testTarget
                }
            };
        } else if (testMode === 'mob') {
            options.mode = 'mob';
            let deviceName = null;
            let platformName = 'Android';
            let platformVersion = null;
            // in mobile mode, testTarget shall be an object that includes device information (id, osName and osVersion)
            if (testTarget && typeof testTarget === 'object') {
                deviceName = testTarget.name || testTarget.id;
                platformName = testTarget.osName;
                platformVersion = testTarget.osVersion;
            }
            else if (testTarget && typeof testTarget === 'string') {
                deviceName = testTarget;
            }
            caps.deviceName = deviceName;
            caps.platformName = platformName;
            caps.platformVersion = platformVersion;
        } else if (testMode === 'web') {
            options.mode = 'web';
            if (!options.seleniumUrl) {
                options.seleniumUrl = `http://localhost:${seleniumPort}/wd/hub`;
            }
            options.browserName = testTarget;
            // @FIXME: this option should be exposed in reports settings
            options.screenshots = 'never';
        }

        if (stepDelay) {
            options.delay = stepDelay;
        }
        // initialize Oxygen Runner
        try {
            this._emitLogEvent(SEVERITY_INFO, 'Initializing...');
            await this.oxRunner.init(options);
        } catch (e) {
            // the error at .init stage can be caused by parallel call to .kill() method
            // make sure in case we are in the middle of stopping the test to ignore any error at this stage
            if (!this.isStopping) {
                if(typeof e === 'string'){
                    this._emitLogEvent(SEVERITY_ERROR, `Test Failed!: ${e}`);
                } else {
                    this._emitLogEvent(SEVERITY_ERROR, `Test Failed!: ${e.message}. ${e.stack || ''}`);
                }
                await this.dispose();
                return; // if initialization has failed, then do not try to run the test
            }
        }
        this._emitTestStarted();
        // assign user-set breakpoints
        testsuite.testcases[0].breakpoints = this._convertBreakpointsToOxygenFormat(breakpoints);
        // run the test
        try {
            const result = await this.oxRunner.run(testsuite, null, caps);
            // dispose Oxygen Runner and mark the state as not running, before updating the UI
            await this.dispose();
            // eslint-disable-line
            this._emitTestEnded(result);            
        }
        catch (e) {
            if (e.line) {
                this._emitLogEvent(SEVERITY_ERROR, `${e.message} at line ${e.line}`);
            } else {
                this._emitLogEvent(SEVERITY_ERROR, `ERROR: ${e.message}. ${e.stack || ''}`);
            }
            this._emitLogEvent(SEVERITY_ERROR, 'Test Failed!');
            this._emitTestEnded(null, e);
            try {
                await this.dispose();
            }
            catch (e) { console.warn('Call to dispose() method of TestRunnerService failed.', e); }
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

    updateBreakpoints(breakpoints, filePath) {        
        if (this.oxRunner && breakpoints && filePath) {
            this.oxRunner.updateBreakpoints(breakpoints, filePath);
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
        this.oxRunner.on('line-update', (stack, time) => {
            // first entry in the stack is the current file
            // (which can be the primary file or a file loaded via `require`)
            // last entry is the primary file.
            if (Array.isArray(stack) && stack.length > 0) {
                const primaryFile = stack[stack.length - 1].file;
                this.notify({
                    type: EVENT_LINE_UPDATE,
                    time: time,
                    file: stack[0].file,
                    line: stack[0].line,
                    // determine if this the primary file or not (so we can open the relevant tab)
                    primary: primaryFile === stack[0].file
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
            // if we are in the secondary file (loaded via `require`) add 1 since BP indices are 0-based.
            let editorLine = editorFile !== this.mainFilePath ? lineNumber + 1 : lineNumber - getScriptContentLineOffset;
            
            const time = moment.utc().valueOf();
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

        this.oxRunner.on('log-add', (level, msg) => {
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
