/* eslint-disable promise/always-return */
/* eslint-disable promise/catch-or-return */
/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { Runners, ReportAggregator, util as oxutil } from 'oxygen-cli';
import * as cliutil from './cli-util';
import path from 'path';
import moment from 'moment';
import detectPort from 'detect-port';
import ServiceBase from './ServiceBase';

// Events
const EVENT_LOG_ENTRY = 'LOG_ENTRY';
const EVENT_BREAKPOINT = 'BREAKPOINT';
const EVENT_BREAKPOIN_DEACTIVATE = 'BREAKPOIN_DEACTIVATE';
const EVENT_BREAKPOIN_RESOLVED = 'BREAKPOIN_RESOLVED';
const EVENT_LINE_UPDATE = 'LINE_UPDATE';
const EVENT_TEST_STARTED = 'TEST_STARTED';
const EVENT_TEST_ENDED = 'TEST_ENDED';
const EVENT_SEND_START_DATA = 'SEND_START_DATA';

// Severities
const SEVERITY_ERROR = 'ERROR';
const SEVERITY_INFO = 'INFO';

export default class TestRunnerService extends ServiceBase {
    constructor() {
        super();
        this.isRunning = false;
        this.isStopping = false;
        this.runner = null;
        this.reporter = null;
        this.mainFilePath = null;
    }
    
    async start(mainFilePath, breakpoints, runtimeSettings) {
        if (this.runner) {
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
            seleniumPid,
            stepDelay,
            testName,
            rootPath,
            oxConfigFile
        } = testConfig;
        let testsuite = null;

        try {
            testsuite = await oxutil.generateTestSuiteFromJSFile(mainFilePath, paramFilePath, paramMode, true);
        } catch (e) {
            // could get exception only if param file loading fails
            this._emitLogEvent(SEVERITY_ERROR, `Test failed: Unable to load parameters file: ${e.message}`);
            this._emitTestEnded(null, e);
            this.isRunning = false; // oxygen crashed - nothing to dispose, so just unset local vars
            this.runner = null;
            return;
        }
        // set iterations count
        testsuite.cases[0].iterationCount = iterations;
        const casesBreakpoints = this._convertBreakpointsToOxygenFormat(breakpoints);
        testsuite.cases[0].breakpoints = casesBreakpoints;
        // prepare launch options and capabilities
        let options = {};
        let caps = {};
        options.suites = [testsuite];
        options.debugPortIde = dbgPort;
        options.require = {
            allow: true,
            allowGlobal: true
        };
        options.reopenSession = reopenSession || false;
        const cloudProviderSvc = this.getService('CloudProvidersService');

        if (cloudProviderSvc && testProvider && testProvider.id) {
            const provider = cloudProviderSvc.getProvider(testProvider.id);

            if (provider) {
                const providerCaps = provider.updateCapabilities(testTarget, caps, testName);

                for(var value in providerCaps){
                    caps[value] = providerCaps[value];
                }

                const providerOptions = provider.updateOptions(testTarget, options);
                options = Object.assign(options, providerOptions);
            }
        }
        const visualTestingProvidersServiceSvc = this.getService('VisualTestingProvidersService');
        if (visualTestingProvidersServiceSvc) {
            const applitoolsProvider = visualTestingProvidersServiceSvc.getProvider('applitools');
            if (applitoolsProvider) {
                const applitoolsproviderOptions = applitoolsProvider.updateOptions(options);
                if (applitoolsproviderOptions) {
                    for (var value2 in applitoolsproviderOptions) {
                        options[value2] = applitoolsproviderOptions[value2];
                    }
                }
            }
        }

        // add local run options, if no cloud provider was selected
        if (!testProvider || !testProvider.id) {
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
                caps.browserName = testTarget;
            }
        }
            
        if (stepDelay) {
            options.delay = stepDelay;
        }

        if(rootPath){
            options.rootPath = rootPath;
        }

        if(seleniumPid){
            options.seleniumPid = seleniumPid;
        }

        if(oxConfigFile){
            const targetFile = cliutil.processTargetPath(oxConfigFile);
            const argv = {};

            // console.log('TestRunner : targetFile', targetFile);

            if(targetFile){
                const config = await cliutil.getConfigurations(targetFile, argv, this.mainFilePath);

                if(config && config.suites){
                    if(oxConfigFile && mainFilePath && mainFilePath === oxConfigFile){
                        // use suites from config file if user run config file
                    } else {
                        delete config.suites;
                    }
                }

                // console.log('TestRunner : config', config);

                const oxConfigOptions = await cliutil.generateTestOptions(config, argv);
                
                // console.log('TestRunner : options', oxConfigOptions);

                if (oxConfigOptions) {
                    const data = await cliutil.prepareTestData(oxConfigOptions);
                    
                    if (data) {
                        if (data.options) {
                            for (var oxConfigOption in data.options) {
                                options[oxConfigOption] = data.options[oxConfigOption];
                            }
                        }
                    }
                }
            }
        }
        

        if(caps){
            const playStartEventData = {
                provider: 'Local'
            };

            if(caps.browserName){
                playStartEventData.browserName = caps.browserName;
            }
            if(caps.browserVersion){
                playStartEventData.browserVersion = caps.browserVersion;
            }
            if(caps.platform){
                playStartEventData.platform = caps.platform;
            }
            if(caps['lamda:options']){
                playStartEventData.provider = 'Lambdatest';
            }
            if(caps['testingBot:options']){
                playStartEventData.provider = 'TestingBot';
            }
            if(caps['sauce:options']){
                playStartEventData.provider = 'Saucelabs';
            }
            if(caps['testObject:options']){
                playStartEventData.provider = 'Testobject';
            }
            
            this._emitplayStartEvent(playStartEventData);
        }

        // initialize Oxygen Runner
        try {
            this.reporter = new ReportAggregator(options);            
            await this._launchTest(options, caps);
        } catch (e) {
            // the error at .init stage can be caused by parallel call to .kill() method
            // make sure in case we are in the middle of stopping the test to ignore any error at this stage
            if (!this.isStopping) {
                this._emitTestEnded(null, e);
            }            
        }      
        finally {
            this.isRunning = false;
            // dispose Oxygen Runner and mark the state as not running, before updating the UI
            await this.dispose();            
        }
    }

    async stop() {
        this.notify({
            type: EVENT_LOG_ENTRY,
            severity: SEVERITY_INFO,
            message: 'Test finished with status --> CANCELED'
        });

        if(this.reporter && this.reporter.removeListener){
            this.reporter.removeListener('runner:start',() => {});
            this.reporter.removeListener('runner:end',() => {});
            this.reporter.removeListener('step:start',() => {});
            this.reporter.removeListener('test-error',() => {});
            this.reporter.removeListener('log',() => {});
        }

        if (this.runner) {
            this.isStopping = true;
            this.isRunning = false;
            try {
                if(this.runner.removeListener){
                    this.runner.removeListener('breakpoint',() => {});
                    this.runner.removeListener('init-done',() => {});
                    this.runner.removeListener('line-update',() => {});
                    this.runner.removeListener('log',() => {});
                    this.runner.removeListener('test-error',() => {});
                    this.runner.removeListener('iteration-end',() => {});
                    this.runner.removeListener('test-end',() => {});
                }

                await this.runner.kill('CANCELED');
                await this.runner.dispose('CANCELED');

                this.runner = null;
                this.mainFilePath = null;
            }
            catch (e) {
                console.log('this.runner.dispose', e);
                // ignore any errors
            }        
        }
        return 'stoped';
    }

    async updateBreakpoints(breakpoints, filePath) {        
        /*
        console.log('--- updateBreakpoints ---');
        console.log('breakpoints', breakpoints);
        console.log('filePath', filePath);
        console.log('--- updateBreakpoints ---');
        */
        if (this.runner && breakpoints && filePath) {
            const start = new Date();
            const result = await this.runner.updateBreakpoints(breakpoints, filePath);
            const end = new Date();
            const duration = (end - start);
            console.log('updateBreakpoints takes ' + duration + ' ms ');
            return result;
        } else {
            return null;
        }
    }

    continue() {
        if (this.runner) {
            this.runner.debugContinue();
        }
    }

    async dispose(status = null) {
        if (this.runner) {
            this.runner.dispose(status).then(()=>{});
            this.runner = null;
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
            this._emitLogEvent(SEVERITY_INFO, 'Initializing...');
            // initialize runner
            await runner.init(opts, caps, this.reporter);   
            // run test 
            this._emitLogEvent(SEVERITY_INFO, 'Running test...');
            const result = await runner.run();
            // dispose runner

            if(result && result.status){
                await runner.dispose(result.status);
            }
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
        this.finished = false;
        this.notify({
            type: EVENT_TEST_STARTED,
        });
    }

    _emitplayStartEvent(playStartEventData){
        this.notify({
            type: EVENT_SEND_START_DATA,
            data: playStartEventData
        });
    }

    _emitTestEnded(result, error, noLog = false) {
        this.finished = true;
        if (!noLog) {
            const status = result && result.status ? result.status.toUpperCase() : 'FAILED';
            if (error) {
                if (typeof error === 'string') {
                    this._emitLogEvent(SEVERITY_ERROR, `Test failed: ${error}.`);
                }
                else {
                    this._emitLogEvent(SEVERITY_ERROR, `Test failed: ${error.message}. ${error.stack || ''}`);
                }
            }
            else if (result && result.failure) {
                const loc = this._getLocationInfo(result.failure.location);
                const message = result.failure.message ? ` "${result.failure.message}"` : '';
                const locStr = loc && loc.line && loc.file && loc.file === this.mainFilePath ? ` at line ${loc.line}` : '';
                this._emitLogEvent(SEVERITY_ERROR, `Test failed: [${result.failure.type}]${message}${locStr}`);
            }
            this._emitLogEvent(SEVERITY_INFO, `Test finished with status --> ${status}.`);
        }
        this.notify({
            type: EVENT_TEST_ENDED,
            result: result,
            error: error,
        });
    }

    _emitLogEvent(severity, message) {
        if(this.runner && this.isRunning){
            this.notify({
                type: EVENT_LOG_ENTRY,
                severity: severity,
                message: message,
            });
        }
    }

    _emitLineUpdate(time, file, line, primary) {
        if(this.runner && this.isRunning){
            // console.log('--- debug _emitLineUpdate ---');
            // console.log('line', line);
            // console.log('file', file);
            // console.log('--- debug ---');
    
            this.notify({
                type: EVENT_LINE_UPDATE,
                time,
                file,
                line,
                primary,
            });
        }
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
                // determine if this the primary file or not (so we can open the relevant tab)
                const primary = this.mainFilePath === loc.file;
                this._emitLineUpdate(step.time, loc.file, loc.line, primary);
            }            
        });

        // @params breakpoint
        if(this.runner && this.runner.on){
            this.runner.on('breakpoint', (breakpoint) => {
                this._handleBreakpoint(breakpoint);
            });

            this.runner.on('breakpointError', (breakpointError) => {
                this._handleBreakpointError(breakpointError);
            });
            
            
            this.runner.on('test-error', (err) => {
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
        }


        this.reporter.on('log', ({ level, msg, src }) => {    
            if (src && src !== 'system') {
                this._emitLogEvent(level ? level.toUpperCase() : SEVERITY_INFO, msg);
            }
        });
    }

    _handleBreakpointError(breakpointError){
        const {
            message,
            lineNumber,
            fileName
        } = breakpointError;

        const editorFile = fileName ? fileName : this.mainFilePath;
        let editorLine = lineNumber;
        const time = moment.utc().valueOf();

        this.notify({
            type: EVENT_BREAKPOIN_DEACTIVATE,
            time,
            file: editorFile,
            line: editorLine,
            // alway open the tab (make it active) in which breakpoint occured
            primary: true,
        });

        if(message){
            this._emitLogEvent(SEVERITY_INFO, message);
        }
    }

    _handleBreakpoint(breakpoint) {
        const { lineNumber, fileName, variables, resolved } = breakpoint;
        // if no fileName is received from the debugger (not suppose to happen), assume we are in the main script file
        const editorFile = fileName ? fileName : this.mainFilePath;
        // if we are in the main script file, adjust line number according to script boilerplate offset
        // if we are in the secondary file (loaded via `require`) add 1 since BP indices are 0-based.
        let editorLine = lineNumber + 1;
        
        const time = moment.utc().valueOf();
        
        console.log('--- debug _handleBreakpoint ---');
        console.log('line', editorLine);
        console.log('file', editorFile);
        console.log('resolved', resolved);
        console.log('--- debug ---');

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
            variables: variables
        });

        if(resolved){
            this.notify({
                type: EVENT_BREAKPOIN_RESOLVED,
                time,
                file: editorFile,
                line: editorLine,
                // alway open the tab (make it active) in which breakpoint occured
                primary: true,
            });
        }
    }

    _getLocationInfo(location) {
        if (!location) {
            return null;
        }
        const parts = location.split(':');

        let fileName;
        let line;
        let column;

        if (process.platform === 'win32') {
            if (parts.length === 4) {

                fileName = parts[0] + ':' + parts[1];
                // on Windows, file path might include Linux '/' path delimeter
                // make sure to replace it with a proper Windows path delimiter ('\')
                fileName = fileName.replace(/\//g, '\\');
                line = parts[2];
                column = parts[3];
                
            } else {
                // network folder
                fileName = parts[0];
                // on Windows, file path might include Linux '/' path delimeter
                // make sure to replace it with a proper Windows path delimiter ('\')
                fileName = fileName.replace(/\//g, '\\');
                line = parts[1];
                column = parts[2];

            }
        } else {
            if (parts.length != 3) {
                return null;
            }

            fileName = parts[0];
            line = parts[1];
            column = parts[2];
        }

        return {
            file: fileName,
            line: parseInt(line),
            column: parseInt(column)
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
        for (var filePath of Object.keys(breakpoints)) {
            if (!Array.isArray(breakpoints[filePath])) {
                continue;
            }
            for (var line of breakpoints[filePath]) {
                _breakpoints.push({ file: filePath, line: line });
            }
        }
        return _breakpoints;
    }
}
