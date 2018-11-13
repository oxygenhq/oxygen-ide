/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { util, Runner } from 'oxygen-cli';
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
    start(mainFilePath, breakpoints, runtimeSettings) {
        if (this.oxRunner) {
            throw Error('Previous test is still running. Stop the previous test before calling "start" method.');
        }
        this.isRunning = true;
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
            paramFilePath, paramMode
        } = testConfig;

        oxutil.generateTestSuiteFromJSFile(mainFilePath, paramFilePath, paramMode)
        .then((testsuite) => {
            const {
                iterations,
                reinitBrowser,
                dbgPort,
                testMode,
                testTarget,
                seleniumPort,
                stepDelay,
            } = testConfig;

            testsuite.testcases[0].iterationCount = iterations;
            testsuite.testcases[0].ReopenBrowser = reinitBrowser;

            // prepare launch options
            const options = {};
            options.debugPort = dbgPort;
            options.debugPortIde = dbgPort;
            options.require = {
              allow: true,
              allowGlobal: true
            };
            
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
                options.initDriver = true;
                options.reopenBrowser = (reinitBrowser || false);
                // @FIXME: this option should be exposed in reports settings
                options.screenshots = 'never';
            }

            if (stepDelay) {
                options.delay = stepDelay;
            }
            
            try {
                this._emitLogEvent(SEVERITY_INFO, 'Initializing...');

                this.oxRunner
                .init(options)
                .then(() => {
                    this._emitTestStarted();    
                    // assign user-set breakpoints
                    testsuite.testcases[0].breakpoints = this._convertBreakpointsToOxygenFormat(breakpoints);
                    return this.oxRunner.run(testsuite, null, caps);
                })
                .then((tr) => { 
                    // eslint-disable-line
                    this._emitTestEnded(tr);                        
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
                this._emitLogEvent(SEVERITY_ERROR, 'Test Failed!');
                return this.dispose();
            }

            return true;
        })
        .catch((err) => {
            this._emitLogEvent(SEVERITY_ERROR, `Test Suite Error: Cant run init ${err}`);
            return this.dispose();
        });
    }

    async stop() {
        if (this.oxRunner) {
            await this.oxRunner.kill();
            await this.oxRunner.dispose();
            this.oxRunner = null;
            this.isRunning = false;
            this.mainFilePath = null;
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
        // @TODO: line highlight
        // @TODO: ask about breakpoints
        this.oxRunner.on('line-update', (line) => {
            this.notify({
                type: EVENT_LINE_UPDATE,
                file: this.mainFilePath,
                line: line,
            });
        });

        // @params breakpoint, testcase
        this.oxRunner.on('breakpoint', (breakpoint) => {
            const { lineNumber } = breakpoint;
            const { getScriptContentLineOffset } = this.oxRunner;
            const editorLine = lineNumber - getScriptContentLineOffset;

            this.notify({
                type: EVENT_LINE_UPDATE,
                file: this.mainFilePath,
                line: editorLine,
            });
            // bubble the breakpoint event further up
            this.notify({
                type: EVENT_BREAKPOINT,
                file: this.mainFilePath,
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
            this._emitLogEvent(SEVERITY_INFO, `Finished with status --> ${status}`);
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
