/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { Runners, ReportAggregator, util as oxutil } from 'oxygen-cli';
import path from 'path';
import moment from 'moment';
import detectPort from 'detect-port';
import ServiceBase from './ServiceBase';

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
    reporter = null;
    mainFilePath = null;

    constructor() {
        super();
    }
    
    async start(mainFilePath, breakpoints, runtimeSettings) {
        console.log('breakpoints', breakpoints);
        if (this.oxRunner) {
            throw Error('Previous test is still running. Stop the previous test before calling "start" method.');
        }
        this.isRunning = true;
        this.isStopping = false;
        const framework = runtimeSettings.framework || 'oxygen';        
        // store mainFilePath for later, so when we receive LINE_UPDATE event from Oxygen, 
        // we can bubble it up and include the file name in addition to line number (Oxygen sends only a line number)
        this.mainFilePath = mainFilePath;
        const filename = path.basename(this.mainFilePath, '.js');
        const testConfig = {
            testName: filename,
            framework: framework,
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
        testsuite.cases[0].iterationCount = iterations;
        const casesBreakpoints = this._convertBreakpointsToOxygenFormat(breakpoints);

        console.log('casesBreakpoints', casesBreakpoints);

        testsuite.cases[0].breakpoints = casesBreakpoints;
        // prepare launch options and capabilities
        const caps = {};
        const options = {};
        options.suites = [testsuite];
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
            this.reporter = new ReportAggregator(options);            
            await this._launchTest(options, caps);
        } catch (e) {
            // the error at .init stage can be caused by parallel call to .kill() method
            // make sure in case we are in the middle of stopping the test to ignore any error at this stage
            if (!this.isStopping) {
                if(typeof e === 'string'){
                    this._emitLogEvent(SEVERITY_ERROR, `Test Failed!: ${e}`);
                    this._emitTestEnded(null, e);
                } else {
                    this._emitLogEvent(SEVERITY_ERROR, `Test Failed!: ${e.message}. ${e.stack || ''}`);
                    this._emitTestEnded(null, e);
                }
            }            
        }      
        finally {
            this.isRunning = false;
            // dispose Oxygen Runner and mark the state as not running, before updating the UI
            await this.dispose();            
        };
    }

    async stop() {
        if (this.runner) {
            this.isStopping = true;
            try {
                await this.runner.kill();
                await this.runner.dispose();
            }
            catch (e) {
                // ignore any errors
            }            
            this.runner = null;
            this.isRunning = false;
            this.mainFilePath = null;
            this._emitLogEvent(SEVERITY_INFO, 'Test finished with status --> CANCELED');
        }
    }

    updateBreakpoints(breakpoints, filePath) {        

        console.log('--- updateBreakpoints ---');
        console.log('this.oxRunner', this.oxRunner);
        console.log('breakpoints', breakpoints);
        console.log('filePath', filePath);
        console.log('--- updateBreakpoints ---');

        if (this.runner && breakpoints && filePath) {
            this.runner.updateBreakpoints(breakpoints, filePath);
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

    async _launchTest(opts, caps) {        
        const runner = this.runner = this._instantiateRunner(opts);
        if (!runner) {
            const framework = opts.framework;
            throw new Error(`Cannot find runner for the specified framework: ${framework}.`);
        }
        this._hookToOxygenEvents();
        try {
            // initialize runner
            await runner.init(opts, caps, this.reporter);   
            // run test 
            const results = await runner.run();
            // dispose runner
            await runner.dispose();
        }
        catch (e) {
            // if this is custom error message
            if (e.error) {
                var errMsg = '';
                var err = e.error;
                if (err.type)
                    errMsg += err.type + ' - ';
                if (err.message)
                    errMsg += err.message;
                else
                    errMsg = err.toString();
                throw new Error(errMsg);
            }
            else {
                throw e;
            }
        }
        finally {
            this.runner = null;
        }
    }

    _instantiateRunner(opts) {
        const framework = opts.framework || 'oxygen';
        if (Runners.hasOwnProperty(framework)) {
            return new Runners[framework]();
        }
        return null;
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
        this.reporter.on('runner:start', ({ rid, opts, caps }) => {
            this._emitTestStarted();
        });

        this.reporter.on('runner:end', ({ rid, result }) => {
            this._emitTestEnded(result);
        });

        this.reporter.on('step:start', ({ rid, step }) => {
            const loc = this._getLocationInfo(step.location);
            if (loc) {
                this.notify({
                    type: EVENT_LINE_UPDATE,
                    time: step.time,
                    file: loc.file,
                    line: loc.line,
                    // determine if this the primary file or not (so we can open the relevant tab)
                    primary: true//primaryFile === stack[0].file
                });
            }            
        });

        // @params breakpoint
        this.runner.on('breakpoint', (breakpoint) => {
            console.log('this.runner.on breakpoint', breakpoint);
            this.handleBreakpoint(breakpoint);            
        });

        this.reporter.on('test-error', (err) => {
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

        this.reporter.on('log-add', ({level, msg}) => {            
            this._emitLogEvent(SEVERITY_INFO, `LEVEL: ${level} MSG: ${msg}`);
        });

        this.reporter.on('iteration-start', (i) => {
            this._emitLogEvent(SEVERITY_INFO, `Starting iteration #${i}`);
        });

        this.reporter.on('iteration-end', (result) => {
            const status = result.status ? result.status.toUpperCase() : 'UNKOWN';
            this._emitLogEvent(SEVERITY_INFO, `Test finished with status --> ${status}`);
        });
    }

    _handleBreakpoint(breakpoint) {
        const { lineNumber, fileName } = breakpoint;
        // if no fileName is received from the debugger (not suppose to happen), assume we are in the main script file
        const editorFile = fileName ? fileName : this.mainFilePath;
        // if we are in the main script file, adjust line number according to script boilerplate offset
        // if we are in the secondary file (loaded via `require`) add 1 since BP indices are 0-based.
        let editorLine = editorFile !== this.mainFilePath ? lineNumber + 1 : lineNumber;
        
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
    }

    _getLocationInfo(location) {
        if (!location) {
            return null;
        }
        const parts = location.split(':');
        if (parts.length != 3) {
            return null;
        }
        return {
            file: parts[0],
            line: parts[1],
            column: parts[2]
        };
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
