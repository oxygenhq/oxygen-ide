/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';
import cp from 'child_process';
import net from 'net';
import detectPort from 'detect-port';
import { app } from 'electron';
import * as chromeFinder from './chrome-finder';
import * as edgeFinder from './edge-finder';
import * as firefoxFinder from './firefox-finder';
import { exec } from 'teen_process';
import fs from 'fs-extra';
import tmp from 'tmp';
import extract from 'extract-zip';
import fetch from 'node-fetch';
import ServiceBase from '../ServiceBase';
import * as glob from 'glob';

import cfg from '../../config.json';
const selSettings = cfg.selenium;

// Events
const ON_SELENIUM_STARTED = 'SELENIUM_STARTED';
const ON_SELENIUM_STOPPED = 'SELENIUM_STOPPED';
const ON_CHROME_DRIVER_ERROR = 'ON_CHROME_DRIVER_ERROR';
const ON_FINDED_CHROME_DRIVER_VERSION = 'ON_FINDED_CHROME_DRIVER_VERSION';
const ON_EDGE_FINDED = 'ON_EDGE_FINDED';
const ON_FIREFOX_FINDED = 'ON_FIREFOX_FINDED';
const CHROMEDRIVER_FOLDER_START = 'chromedriver-';
// chrome < 115
const CHROMEDRIVER_PRE_115_API_URL = 'https://chromedriver.storage.googleapis.com';
// chrome >= 115
const CHROMEDRIVER_API_URL = 'https://googlechromelabs.github.io/chrome-for-testing/known-good-versions-with-downloads.json';
const CHROMEDRIVER_DOWNLOAD_URL = 'https://storage.googleapis.com/chrome-for-testing-public';

const EDGE_FOLDER_START = 'edgedriver-';
const ON_EDGE_DRIVER_ERROR = 'ON_EDGE_DRIVER_ERROR';
const EDGE_BASE_URL = 'https://msedgewebdriverstorage.blob.core.windows.net/edgewebdriver';
const EDGE_DOWNLOAD_DRIVER_URL = 'https://msedgedriver.microsoft.com';

// maps testTarget values (app/renderer/store/test/reducer.js) to the driver
// keys used internally by this service (driverProcs / driverPorts)
export const TEST_TARGET_TO_DRIVER_KEY = {
    chrome: 'chrome',
    firefox: 'firefox',
    MicrosoftEdge: 'edge',
    MicrosoftEdgeIEMode: 'ie',
};

const DRIVER_BASE_PORTS = { chrome: 9515, edge: 9516, firefox: 9517, ie: 9518 };
const DRIVER_BINARY_NAMES = {
    chrome: 'chromedriver.exe',
    edge: 'msedgedriver.exe',
    firefox: 'geckodriver.exe',
    ie: 'IEDriverServer_x86.exe',
};

export default class SeleniumService extends ServiceBase {

    constructor() {
        super();

        this.driverProcs = {};          // { chrome, edge, firefox, ie } -> ChildProcess
        this.driverPorts = {};          // { chrome, edge, firefox, ie } -> port number
        this.resolvedDriverPaths = {};  // { chrome, edge, firefox, ie } -> local binary path
        // { chrome, edge, firefox, ie } -> most recently used port. Each fresh spawn picks a
        // new port so the HTTP client never reuses a pooled keep-alive socket that was talking
        // to the previous (now-dead) process on that port.
        this.lastDriverPorts = {};

        this.downloadChromeDriver = this.downloadChromeDriver.bind(this);
        this.downloadEdgeDriver = this.downloadEdgeDriver.bind(this);
    }

    // called once, at project-open time. Only resolves (detects/downloads) each
    // browser's matching driver binary path — it does NOT spawn any driver
    // process. Driver processes are spawned lazily, per test run, via
    // startDriver(), so an installed-but-unused browser never gets a running
    // driver process at all.
    async start() {
        let cwd;
        if (process.env.NODE_ENV === 'production') {
            cwd = path.resolve(__dirname, process.env.RELEASE_BUILD ? '../../app.asar.unpacked/main/selenium' : 'selenium');
        } else {
            cwd = path.resolve(__dirname, '..', '..', 'selenium');
        }

        try {
            await this.copyBundledDrivers(cwd);
        } catch (e) {
            console.warn('Failed to copy bundled drivers', e);
        }

        // Chrome/Firefox (and IE on Windows) are always listed in the target dropdown
        // regardless of whether they're installed, but Edge is only added once detected —
        // so it still needs an eager, driver-download-free presence check here
        await this.detectEdgeBrowser();
        await this.detectFirefoxBrowser();

        return null;
    }

    // called whenever the user picks a browser in the target dropdown, so driver
    // detection/download only happens for browsers the user actually intends to use,
    // instead of eagerly for every supported browser at project-open time
    async checkDriver(testTarget) {
        const driverKey = TEST_TARGET_TO_DRIVER_KEY[testTarget] || testTarget;
        if (!DRIVER_BASE_PORTS[driverKey]) {
            return null;
        }
        return this._resolveDriverPath(driverKey);
    }

    stop() {
        this._killDrivers();
    }

    async restart() {
        this.stop();
        this.resolvedDriverPaths = {};
        await this.start();
    }

    dispose() {
        this._killDrivers();
    }

    _emitStoppedEvent(failed, msg) {
        this.notify(
            ON_SELENIUM_STOPPED,
            msg,
            (failed ? ServiceBase.SEVERITY_ERROR : ServiceBase.SEVERITY_INFO),
        );
    }

    _emitStartedEvent({driverKey, port, browserTimeout}) {
        console.log('_emitStartedEvent', driverKey, port);

        this.notify({
            type: ON_SELENIUM_STARTED,
            driverKey: driverKey,
            port: port,
            browserTimeout: browserTimeout
        });
    }

    _emitLogEvent(message, severity) {
        this.log(
            message,
            severity,
        );
    }

    // kill all tracked driver processes directly, then best-effort clean up
    // any orphaned driver processes left over from a previous crashed run
    _killDrivers() {
        for (const key of Object.keys(this.driverProcs)) {
            const proc = this.driverProcs[key];
            try {
                if (proc && !proc.killed) {
                    proc.kill();
                }
            } catch (e) {
                console.warn(`Failed to kill ${key} driver process:`, e);
            }
        }
        this.driverProcs = {};

        if (process.platform === 'win32') {
            this._killOrphansWindows();
        }
    }

    // best-effort fallback for orphans left behind by a previous IDE crash
    // (e.g. IDE process itself was killed before dispose() could run).
    // Matched by binary name AND last-known port, so we don't strand-kill an
    // unrelated driver instance the user might be running independently.
    _killOrphansWindows() {
        for (const key of Object.keys(DRIVER_BINARY_NAMES)) {
            const port = this.driverPorts[key];
            if (!port) {
                continue;
            }
            try {
                const name = DRIVER_BINARY_NAMES[key];
                const filter = `Name = '${name}' and CommandLine like '%${port}%'`;
                const script = `Get-CimInstance Win32_Process -Filter "${filter}" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }`;
                // execSync routes the whole command through cmd.exe first, whose
                // backslash-quote escaping is incompatible with PowerShell's own —
                // the script arrives already mangled. spawnSync with an args array
                // passes the script straight through, bypassing shell quoting entirely.
                cp.spawnSync('powershell', ['-NoProfile', '-Command', script], { stdio: 'pipe' });
            } catch (e) {
                console.warn(`Failed to kill orphaned ${key} driver: ` + e);
            }
        }
    }

    // lightweight browser-presence check, run eagerly at project-open time so Edge shows
    // up in the browser-target dropdown at all. Unlike edgeStart() it never resolves or
    // downloads a driver binary — that stays deferred until the user actually selects it
    async detectEdgeBrowser() {
        try {
            const edgeDetails = await this.getEdgeVersion();
            if (edgeDetails && edgeDetails.version) {
                console.log('Found installed Edge browser version: ', edgeDetails.version);
                this.notify({
                    type: ON_EDGE_FINDED,
                    path: edgeDetails.path
                });
            }
        } catch (e) {
            // Edge not installed / not detectable — nothing to add to the dropdown
        }
    }

    async edgeStart() {
        var edgeDriver;
        let edgeVersion;
        try {
            const edgeDetails = await this.getEdgeVersion();
            edgeVersion = edgeDetails.version;
            console.log('Found installed Edge browser version: ', edgeVersion);

            if (edgeVersion) {
                this.notify({
                    type: ON_EDGE_FINDED,
                    path: edgeDetails.path
                });
            }

            /*var edgeDriverVersion = await this.getEdgeDriverVersion(edgeVersion);
            console.log('Required EdgeDriver version: ', edgeDriverVersion);*/

            edgeDriver = await this.findLocalEdgeDriver(edgeVersion);
            if (edgeDriver) {
                console.log('Found the matching EdgeDriver at ', edgeDriver);
            } else {
                throw new Error('Unable to find the matching EdgeDriver locally, needs to be downloaded');
            }
        } catch (e) {
            if (process.platform === 'linux') {
                console.log('Failure setting up EdgeDriver: Edge is not supported on Linux.');
                return null;
            }
            console.warn(e.message);
            // if something bad happens, check if user has placed the driver manually
            // getEdgeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            edgeDriver = await this.getEdgeDriverBinPathExact();
            if (edgeDriver) {
                console.log('Using user placed EdgeDriver from ' + edgeDriver);
            } else if (edgeVersion) {
                // EdgeDriver is neither bundled with the IDE nor placed by the user — resolve and
                // download the matching version. Prompt the user instead if that resolution
                // itself fails (e.g. no internet access), rather than falling back to a
                // possibly-mismatched driver.
                this.notify({
                    type: ON_EDGE_DRIVER_ERROR,
                    edgeVersion: edgeVersion
                });
            }
        }
        return edgeDriver;
    }

    // used to display required driver version to the user
    async findChromeDriverVersion() {
        try {
            const chromeVersion = await this.getChromeVersion();
            const chromeMajVersion = chromeVersion.split('.')[0];

            const chromeDriverVersion = chromeMajVersion < 115 ? 
                await this.getChromeDriverPre115Version(chromeMajVersion) :
                await this.getChromeDriverVersion(chromeVersion);

            this.notify({
                type: ON_FINDED_CHROME_DRIVER_VERSION,
                chromeVersion: chromeDriverVersion
            });
        } catch (e) {
            this.notify({
                type: ON_FINDED_CHROME_DRIVER_VERSION
            });
        }
    }

    async chromeStart() {
        var chromeDriverPath;
        var chromeVersion;
        try {
            chromeVersion = await this.getChromeVersion();
            //const chromeMajVersion = chromeVersion.split('.')[0];
            console.log('Found Chrome version: ' + chromeVersion);

            /*chromeDriverVersion = chromeMajVersion < 115 ? 
                await this.getChromeDriverPre115Version(chromeMajVersion) :
                await this.getChromeDriverVersion(chromeVersion);
            */
            // console.log('Required ChromeDriver version: ' + chromeDriverVersion);
            chromeDriverPath = await this.findLocalChromeDriver(chromeVersion);
            if (chromeDriverPath) {
                console.log('Found matching ChromeDriver at ' + chromeDriverPath);
            } else {
                throw new Error('Cannot find it localy');
            }
        } catch (e) {
            console.warn('Failure setting up ChromeDriver.', e);
            // if something bad happens, check if user has placed the driver manually
            // getChromeDriverBinPathExact without arguments will try to resolve driver located at the root folder
            chromeDriverPath = await this.getChromeDriverBinPathExact();
            if (chromeDriverPath) {
                console.log('Using user placed ChromeDriver from ' + chromeDriverPath);
            } else {
                // ChromeDriver is neither bundled with the IDE nor placed by the user — resolve
                // and download the matching version. Prompt the user instead if that resolution
                // itself fails (e.g. no internet access), rather than falling back to a
                // possibly-mismatched driver.
                this.notify({
                    type: ON_CHROME_DRIVER_ERROR,
                    chromeVersion: chromeVersion
                });
            }
        }
        return chromeDriverPath;
    }

    // Firefox is much less version-coupled to geckodriver than Chrome/Edge are to
    // their drivers, so unlike chromeStart()/edgeStart() this does not attempt to
    // download a version-matched geckodriver — it uses the bundled binary directly
    // (mirrors the previous static-path behavior), only adding a Firefox-installed
    // detection step for diagnostic parity/logging with chrome/edge.
    // lightweight browser-presence check, run eagerly at project-open time so Firefox
    // only shows up in the browser-target dropdown if it's actually installed. Unlike
    // geckoStart() it never touches the (bundled) driver binary
    async detectFirefoxBrowser() {
        try {
            const installations = firefoxFinder[process.platform] && firefoxFinder[process.platform]();
            if (installations && installations.length > 0) {
                console.log('Found Firefox at: ', installations);
                this.notify({
                    type: ON_FIREFOX_FINDED,
                    path: installations[0]
                });
            }
        } catch (e) {
            console.warn('Failure detecting Firefox installation.', e);
        }
    }

    async geckoStart() {
        try {
            const installations = firefoxFinder[process.platform] && firefoxFinder[process.platform]();
            if (installations && installations.length > 0) {
                console.log('Found Firefox at: ', installations);
                // geckodriver looks for firefox on the OS PATH / default install
                // location and fails session creation if it's not there (or is
                // installed somewhere non-standard, e.g. a portable/custom install);
                // pass the detected binary path through so it can be supplied as
                // moz:firefoxOptions.binary
                this.notify({
                    type: ON_FIREFOX_FINDED,
                    path: installations[0]
                });
            } else {
                console.warn('Firefox not found on this machine; geckodriver will still be started.');
            }
        } catch (e) {
            console.warn('Failure detecting Firefox installation.', e);
        }

        const bin = process.platform === 'win32' ? 'geckodriver.exe' : 'geckodriver';
        const geckoDriverPath = path.resolve(this.getDriversRootPath(), bin);
        if (!fs.existsSync(geckoDriverPath)) {
            console.warn('Bundled geckodriver not found at ' + geckoDriverPath);
            return null;
        }
        return geckoDriverPath;
    }

    // IEDriverServer is a fixed bundled 32-bit binary, not tied to a "browser
    // version" the way chromedriver/msedgedriver are, so no version-matching is
    // needed. Windows-only, matching the existing _killIEWebdriver() gating in
    // TestRunnerService.js.
    async ieStart() {
        if (process.platform !== 'win32') {
            return null;
        }
        const ieDriverPath = path.resolve(this.getDriversRootPath(), 'IEDriverServer_x86.exe');
        if (!fs.existsSync(ieDriverPath)) {
            console.warn('Bundled IEDriverServer not found at ' + ieDriverPath);
            return null;
        }
        return ieDriverPath;
    }

    // resolves (but does not spawn) the driver binary path for a given driver
    // key, caching the result so repeated startDriver() calls for the same
    // browser don't re-run version detection/download every time
    async _resolveDriverPath(driverKey) {
        if (this.resolvedDriverPaths[driverKey]) {
            return this.resolvedDriverPaths[driverKey];
        }
        let resolved = null;
        if (driverKey === 'chrome') {
            resolved = await this.chromeStart();
        } else if (driverKey === 'edge') {
            resolved = await this.edgeStart();
        } else if (driverKey === 'firefox') {
            resolved = await this.geckoStart();
        } else if (driverKey === 'ie') {
            resolved = await this.ieStart();
        }
        this.resolvedDriverPaths[driverKey] = resolved;
        return resolved;
    }

    // spawns the driver process for the given key only if it isn't already
    // running, and returns the port it's listening on (or null on failure) —
    // this is what makes driver processes start lazily, on first actual use,
    // rather than all up front
    async startDriver(driverKey) {
        const existingProc = this.driverProcs[driverKey];
        if (existingProc && !existingProc.killed && this.driverPorts[driverKey]) {
            // A reused driver may have sat idle since an earlier failed run and could be dead
            // without `killed` reflecting it (e.g. its browser crashed underneath it) — health
            // check before handing it back.
            const alive = await this._waitForStatusReady(this.driverPorts[driverKey], driverKey, { maxRetries: 1, interval: 0 });
            if (alive) {
                return this.driverPorts[driverKey];
            }
            console.warn(`Reused ${driverKey} driver on port ${this.driverPorts[driverKey]} failed a health check — restarting it.`);
            await this.stopDriver(driverKey);
        }

        const driverPath = await this._resolveDriverPath(driverKey);
        if (!driverPath) {
            console.warn(`No local driver binary available for "${driverKey}"`);
            return null;
        }

        const basePort = DRIVER_BASE_PORTS[driverKey];
        const lastPort = this.lastDriverPorts[driverKey];
        // start above the last-used port (see lastDriverPorts); wrap back to base after drifting
        // far enough to avoid climbing indefinitely over a long session.
        const searchFrom = (lastPort && lastPort < basePort + 500) ? lastPort + 1 : basePort;
        const port = await detectPort(searchFrom);
        this.lastDriverPorts[driverKey] = port;
        const spawners = {
            chrome: () => this._spawnChromeDriver(driverPath, port),
            edge: () => this._spawnEdgeDriver(driverPath, port),
            firefox: () => this._spawnGeckoDriver(driverPath, port),
            ie: () => this._spawnIEDriver(driverPath, port),
        };
        const spawn = spawners[driverKey];
        if (!spawn) {
            return null;
        }

        const ready = await spawn();
        if (!ready) {
            return null;
        }

        this.driverPorts[driverKey] = port;
        this._emitStartedEvent({ driverKey, port, browserTimeout: selSettings.browserTimeout });
        return port;
    }

    // stops the driver process for a single browser, e.g. once a test run
    // using it has finished
    async stopDriver(driverKey) {
        const proc = this.driverProcs[driverKey];
        if (proc && !proc.killed) {
            try {
                if (process.platform === 'win32' && typeof proc.pid === 'number') {
                    // proc.kill() on Windows is TerminateProcess — it only kills the driver, not
                    // the browser it spawned as a child, orphaning it. Kill the whole tree instead.
                    await exec('taskkill', ['/PID', String(proc.pid), '/T', '/F']);
                } else {
                    proc.kill();
                }
            } catch (e) {
                console.warn(`Failed to kill ${driverKey} driver process:`, e);
            }
        }
        delete this.driverProcs[driverKey];
        delete this.driverPorts[driverKey];
    }

    async _spawnChromeDriver(driverPath, port) {
        const proc = cp.spawn(driverPath, [`--port=${port}`, '--whitelisted-ips=', '--disable-dev-shm-usage']);
        this.driverProcs.chrome = proc;
        this._handleDriverProcessEvents(proc, 'chrome');
        return await this._waitForStatusReady(port, 'chrome');
    }

    async _spawnEdgeDriver(driverPath, port) {
        // msedgedriver is chromium-based and historically flag-compatible with
        // chromedriver; verify against the bundled binary if issues arise.
        const proc = cp.spawn(driverPath, [`--port=${port}`, '--whitelisted-ips=']);
        this.driverProcs.edge = proc;
        this._handleDriverProcessEvents(proc, 'edge');
        return await this._waitForStatusReady(port, 'edge');
    }

    async _spawnGeckoDriver(driverPath, port) {
        // geckodriver uses a space-separated --port flag, not --port=
        const proc = cp.spawn(driverPath, ['--port', String(port)]);
        this.driverProcs.firefox = proc;
        this._handleDriverProcessEvents(proc, 'firefox');
        return await this._waitForStatusReady(port, 'firefox');
    }

    async _spawnIEDriver(driverPath, port) {
        // IEDriverServer uses the Windows CLI /port=X convention, not --port
        const proc = cp.spawn(driverPath, [`/port=${port}`]);
        this.driverProcs.ie = proc;
        this._handleDriverProcessEvents(proc, 'ie');
        // older IEDriverServer builds may not implement /status; fall back to a
        // raw TCP-connect readiness check if the HTTP poll times out
        const ready = await this._waitForStatusReady(port, 'ie', { maxRetries: 10, interval: 1000 });
        if (ready) {
            return true;
        }
        return await this._waitForTcpReady(port, 'ie');
    }

    // shared readiness poller: chromedriver/msedgedriver/geckodriver and modern
    // IEDriverServer builds all implement the W3C WebDriver /status endpoint
    // ({ value: { ready: bool } })
    async _waitForStatusReady(port, driverKey, { maxRetries = 30, interval = 1000 } = {}) {
        const url = `http://localhost:${port}/status`;
        for (let i = 0; i < maxRetries; i++) {
            try {
                const res = await fetch(url, { timeout: 2000 });
                if (res.ok) {
                    const body = await res.json();
                    if (body && body.value && body.value.ready) {
                        return true;
                    }
                }
            } catch (e) {
                // not up yet, keep polling
            }
            await new Promise(resolve => setTimeout(resolve, interval));
        }
        console.warn(`${driverKey} driver did not respond to /status within ${maxRetries * interval}ms`);
        return false;
    }

    // fallback readiness check for drivers whose /status endpoint isn't available:
    // just wait until the port accepts a raw TCP connection
    _waitForTcpReady(port, driverKey, { maxRetries = 30, interval = 1000 } = {}) {
        return new Promise((resolve) => {
            let attempt = 0;
            const tryConnect = () => {
                attempt++;
                const socket = net.createConnection({ port, host: 'localhost' });
                socket.once('connect', () => {
                    socket.destroy();
                    resolve(true);
                });
                socket.once('error', () => {
                    socket.destroy();
                    if (attempt >= maxRetries) {
                        console.warn(`${driverKey} driver did not become reachable on port ${port} within ${maxRetries * interval}ms`);
                        resolve(false);
                        return;
                    }
                    setTimeout(tryConnect, interval);
                });
            };
            tryConnect();
        });
    }

    _handleDriverProcessEvents(proc, driverKey) {
        if (!proc) {
            console.log(`${driverKey} driver process was not started.`);
            return;
        }
        proc.on('error', (e) => {
            console.log(`Cannot start ${driverKey} driver process.`, e);
            this._emitLogEvent(`[${driverKey}] ${e.toString()}`, ServiceBase.SEVERITY_ERROR);
        });
        proc.stderr && proc.stderr.on('data', (data) => {
            this._emitLogEvent(`[${driverKey}] ${data.toString()}`, ServiceBase.SEVERITY_INFO);
        });
        proc.stdout && proc.stdout.on('data', (data) => {
            this._emitLogEvent(`[${driverKey}] ${data.toString()}`);
        });
        proc.on('exit', (code) => {
            console.log(`${driverKey} driver process finished.`, code);
            delete this.driverProcs[driverKey];
            delete this.driverPorts[driverKey];

            if (code === 1) {
                const msg = `ERROR: ${driverKey} driver couldn't be started. See the Selenium/driver log for more details.`;
                this._emitStoppedEvent(true, msg);
            } else {
                this._emitStoppedEvent();
            }
        });
    }

    copyBundledDrivers(cwd) {
        // since userData is created only after IDE has been launched
        // we cannot place our bundled ChromeDrivers there during installation (also OS X DMG limitations)
        // thus we copy all bundled drivers from the installation dir
        return new Promise((resolve, reject) => {
            fs.copy(
                path.resolve(cwd, process.platform),
                this.getDriversRootPath(),
                { overwrite: false },
                err => {
                    // ignore errors
                    resolve();
                });
        });
    }

    // Gets Edge version. Returns null on failures.
    async getEdgeVersion() {
        const installations = edgeFinder[process.platform]();            
        if (installations && installations.length > 0) {
            console.log('Found Edge at: ', installations);
            if (process.platform === 'win32') {
                let {stdout,stderr} = await exec('powershell', [
                        '-NoProfile',
                        '-Command',
                        `(Get-Item -LiteralPath '${installations[0].replace(/'/g, '\'\'')}').VersionInfo.ProductVersion`
                    ]);

                const edgeVersion = stdout.toString().trim();
                if (!stderr && edgeVersion) {
                    return {
                                version: edgeVersion, //edgeVersion.split('.')[0],
                                path: installations[0]
                            };
                } else {
                    throw new Error('Unable to get Edge version');
                }
            } else {
                let {stdout,stderr} = await exec(installations[0], ['--version']);
                    if (!stderr) {
                        // like Microsoft Edge 85.0.564.63
                        let edgeVersion = stdout.toString().trim();
                        edgeVersion = edgeVersion.substr('Microsoft Edge '.length).split(' ')[0];
                        //edgeVersion = edgeVersion.split('.')[0];
                        return {
                                    version: edgeVersion,
                                    path: installations[0]
                                };
                    } else {
                        throw new Error('Unable to get Edge version');
                    }
            }
        } else {
            throw new Error('Unable to find Edge');
        }
    }

    // Gets Chrome version. Returns null on failures.
    async getChromeVersion() {
        const installations = chromeFinder[process.platform]();

        if (installations && installations.length > 0) {
            console.log('Found Chrome at: ', installations);
            if (process.platform === 'win32') {
                let {stdout,stderr} = await exec('powershell', [
                    '-NoProfile',
                    '-Command',
                    `(Get-Item -LiteralPath '${installations[0].replace(/'/g, '\'\'')}').VersionInfo.ProductVersion`
                ]);

                const chromeVersion = stdout.toString().trim();
                if (!stderr && chromeVersion) {
                    return chromeVersion;
                } else {
                    throw new Error('Unable to get Chrome version');
                }
            } else {
                let {stdout,stderr} = await exec(installations[0], ['--version']);
                if (!stderr) {
                    const chromeVersion = stdout.toString().trim().substr('Google Chrome '.length).split(' ')[0];
                    return chromeVersion;
                } else {
                    throw new Error('Unable to get Chrome version');
                }
            }
        } else {
            throw new Error('Unable to find Chrome');
        }
    }

    convertLastReleaseVersion(body) {
        let result = '';
        const version = Buffer.from(body,'ucs-2').toString('ucs-2');

        if (version && version.length) {
            for (var i = 0; i < version.length; i++) {
                if (parseInt(version[i]) || ['.', '0'].includes(version[i])) {
                    result += `${version[i]}`;
                }
            }
        }

        return result;
    }

    getEdgeDriverVersion(edgeVersion) {
        return new Promise((resolve, reject) => {
            let lastPart = 'MACOS';

            if (process.platform === 'win32') {
                lastPart = 'WINDOWS';
            }
            const versionUrl = `${EDGE_BASE_URL}/LATEST_RELEASE_${edgeVersion}_${lastPart}`;
            console.log('Getting Edge version from ', versionUrl);
            
            return fetch(versionUrl)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver version: ' + res.statusText));
                    }
                    return res.arrayBuffer().then(ab => Buffer.from(ab));
                })
                .then(body => {
                    const driverVersion = this.convertLastReleaseVersion(body);
                    resolve(driverVersion);
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverPre115Version(chromeMajorVersion) {
        return new Promise((resolve, reject) => {
            const versionUrl = `${CHROMEDRIVER_PRE_115_API_URL}/LATEST_RELEASE_${chromeMajorVersion}`;
            console.log('Getting ChromeDriver version from ' + versionUrl);
            return fetch(versionUrl)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver version: ' + res.statusText));
                    }
                    return res.arrayBuffer().then(ab => Buffer.from(ab));
                })
                .then(body => {
                    let version;
                    if (body && body.toString) {
                        const bodyToString = body.toString();

                        if (bodyToString) {
                            version = bodyToString;
                        } else {
                            version = Buffer.from(body,'utf-8').toString();
                        }
                    } else {
                        version = Buffer.from(body,'utf-8').toString();
                    }
                    resolve(version);
                })
                .catch(err => reject(err));
        });
    }

    // starting with v115 chrome has different api for driver downloads
    getChromeDriverVersion(chromeVersion) {
        return new Promise((resolve, reject) => {
            console.log(`Getting ChromeDriver 115+ version JSON ${CHROMEDRIVER_API_URL}`);
            return fetch(CHROMEDRIVER_API_URL)
                .then(res => {
                    if (!res.ok) {
                        reject(new Error('Unable to get ChromeDriver versions JSON: ' + res.statusText));
                    }
                    return res.arrayBuffer().then(ab => Buffer.from(ab));
                })
                .then(body => {
                    var bodyStr = Buffer.from(body,'utf-8').toString();
                    var json = JSON.parse(bodyStr);

                    if (!json.versions) {
                        reject('No versions found in the json');
                        return;
                    }

                    // find exact match
                    for (let ver of json.versions) {
                        if (ver.version == chromeVersion) {
                            resolve(chromeVersion);
                            return;
                        }
                    }

                    // find closest version if no exact match
                    var baseVersion = chromeVersion.substring(0, chromeVersion.lastIndexOf('.'));
                    for (var i = json.versions.length - 1; i >= 0; i--) {
                        let ver = json.versions[i];
                        if (ver.version.startsWith(baseVersion)) {
                            resolve(ver.version);
                            return;
                        }
                    }

                    reject('No matching version found in the json');
                })
                .catch(err => reject(err));
        });
    }

    getChromeDriverDownloadUrl(driverVersion) {
        const maj = driverVersion.split('.')[0];
        const patchedVersion = this.patchDriverVersion(driverVersion);

        if (maj < 115) {
            let zipFilename;
            switch (process.platform) {
                case 'win32':
                    zipFilename = 'chromedriver_win32.zip'; break;
                case 'darwin':
                    zipFilename = 'chromedriver_mac64.zip'; break;
                case 'linux':
                    zipFilename = 'chromedriver_linux64.zip'; break;
                default:
                    zipFilename = null;
            }
            return `${CHROMEDRIVER_PRE_115_API_URL}/${driverVersion}/${zipFilename}`;  
        } else {
            let zipFilename;
            const archName = process.arch;
            switch (process.platform) {
                case 'win32':
                    zipFilename = 'win64/chromedriver-win64.zip'; break;
                case 'darwin':
                    zipFilename = `mac-${archName}/chromedriver-mac-${archName}.zip`; break;
                case 'linux':
                    zipFilename = 'linux64/chromedriver-linux64.zip'; break;
                default:
                    zipFilename = null;
            }
            return `${CHROMEDRIVER_DOWNLOAD_URL}/${patchedVersion}/${zipFilename}`;  
        }
    }

    getEdgeDriverDownloadUrl(driverVersion) {
        var zipFilename;
        switch (process.platform) {
        case 'win32':
            zipFilename = 'edgedriver_win32.zip'; break;
        case 'darwin':
            zipFilename = 'edgedriver_mac64.zip'; break;
        default:
            zipFilename = null;
        }

        return `${EDGE_DOWNLOAD_DRIVER_URL}/${driverVersion}/${zipFilename}`;
    }

    getDriversRootPath() {
        return path.resolve(app.getPath('userData'), 'drivers');
    }

    getDirectories = (source) => {
        return fs.readdirSync(source, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    };

    // find path to exact chromedriver version
    // or to the user placed binary in the root folder if driverVersion is falsy
    getChromeDriverBinPathExact(driverVersion) {
        return new Promise((resolve, reject) => {
            const driverBin = path.resolve(
                this.getDriversRootPath(),
                driverVersion ? CHROMEDRIVER_FOLDER_START + driverVersion : '',
                'chromedriver' + (process.platform === 'win32' ? '.exe' : '')
            );

            fs.access(driverBin, err => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(driverBin);
            });
        });
    }

    // find path to exact edfedriver version
    // or to the user placed binary in the root folder if driverVersion is falsy
    getEdgeDriverBinPathExact(driverVersion) {
        return new Promise((resolve, reject) => {
            const driverBin = path.resolve(
                this.getDriversRootPath(),
                driverVersion ? EDGE_FOLDER_START + driverVersion : '',
                'msedgedriver' + (process.platform === 'win32' ? '.exe' : '')
            );

            fs.access(driverBin, err => {
                if (err) {
                    resolve(null);
                    return;
                }
                resolve(driverBin);
            });
        });
    }

    // find path to the highest available BUILD version. E.g 85.0.4183.xx
    getChromeDriverBinPathApprox(driverVersion) {
        const segments = driverVersion.split('.');
        const globVersion = `${segments[0]}.${segments[1]}.${segments[2]}.*/chromedriver${process.platform === 'win32' ? '.*' : ''}`;

        // glob treats backslash as an escape char, so the backslash-separated absolute
        // path produced by path.resolve() on Windows never matches — normalize to '/'.
        const approx = path.resolve(this.getDriversRootPath(), CHROMEDRIVER_FOLDER_START + globVersion).replace(/\\/g, '/');
        const files = glob.sync(approx);
        if (!files || files.length === 0) return null;
        files.sort((a, b) => {
            var buidVerA = parseInt(path.basename(a).split('.')[3], 10);
            var buidVerB = parseInt(path.basename(b).split('.')[3], 10);
            return buidVerA - buidVerB;
        });
        return files[files.length - 1];
    }

    patchDriverVersion(orgDriverVersion) {
        const segmentsExceptLast = orgDriverVersion.split('.').slice(0, -1);
        return [...segmentsExceptLast, '0'].join('.');
    }

    // kill any active chromedriver processes
    async _killChromeDriverProcess() {
        try {
            if (process.platform === 'win32') {
                await exec('taskkill', ['/IM', 'chromedriver.exe', '/F']);
            } else {
                await exec('killall', ['chromedriver']);
            }
        } catch (err) {
            // ignore errors since the process does not necessary exists at all
        }
    }

    // kill any active edgedriver processes
    async _killEdgeDriverProcess() {

        try {
            if (process.platform === 'win32') {
                await exec('taskkill', ['/IM', 'msedgedriver.exe', '/F']);
            } else {
                await exec('killall', ['msedgedriver']);
            }
        } catch (err) {
            // ignore errors since the process does not necessary exists at all
        }
    }

    // return path to the driver binary if exists or null otherwise
    async findLocalChromeDriver(driverVersion) {
        if (!driverVersion) {
            return;
        }
        // for Chrome 73+
        if (driverVersion.split('.').length > 2) {
            return await this.getChromeDriverBinPathApprox(driverVersion);
        } else {
            return await this.getChromeDriverBinPathExact(driverVersion);
        }
    }

    findLocalEdgeDriver(driverVersion) {
        if (!driverVersion) {
            return;
        }
        const segments = driverVersion.split('.');
        const globVersion = `${segments[0]}.${segments[1]}.${segments[2]}.*/msedgedriver${process.platform === 'win32' ? '.*' : ''}`;
        {
            // glob treats backslash as an escape char, so the backslash-separated absolute
            // path produced by path.resolve() on Windows never matches — normalize to '/'.
            const approx = path.resolve(this.getDriversRootPath(), EDGE_FOLDER_START + globVersion).replace(/\\/g, '/');
            const files = glob.sync(approx);
            if (!files || files.length === 0) return null;
            files.sort((a, b) => {
                var aFolerName = path.basename(path.dirname(a));
                var bFolerName = path.basename(path.dirname(b));
                var buidVerA = parseInt(aFolerName.split('.')[3], 10);
                var buidVerB = parseInt(bFolerName.split('.')[3], 10);
                return buidVerA - buidVerB;
            });
            return files[files.length - 1];
        }
    }

    fetchDriver(downloadUrl) {
        return new Promise((resolve, reject) => {
            try {
                fetch(downloadUrl)
                    .then(res => {
                        if (!res.ok) {
                            return new Error('Unable to download Driver: ' + res.statusText);
                        }

                        return res.arrayBuffer().then(ab => Buffer.from(ab));
                    })
                    .then(buffer => {
                        if (buffer instanceof Error) {
                            resolve(buffer);
                        } else {
                            var zipPath = tmp.tmpNameSync();
                            fs.writeFile(zipPath, buffer, err => {
                                if (err) {
                                    console.log('writeFile error', err);
                                    resolve(err);
                                }
                                resolve(zipPath);
                            });
                        }
                    }).catch(err => {
                        console.log('fetchDriver fetch error', err);
                        resolve(err);
                    });
            } catch (error) {
                console.log('fetchDriver error', error);
                resolve(error);
            }
        });
    }

    async decompressZip(driverVersion, zipPath, folderStart) {
        var driverDir = path.resolve(this.getDriversRootPath(), folderStart + driverVersion);
        await extract(zipPath, { dir: driverDir });

        // some drivers for chrome >= 115 will have an internal directory zipped
        // so we need to move the binary outside of it

        let subdir;
        switch (process.platform) {
            case 'win32':
                subdir = 'chromedriver-win64'; break;
            case 'darwin':
                subdir = 'chromedriver-mac-x64'; break;
            case 'linux':
                subdir = 'chromedriver-linux64'; break;
            default:
                subdir = null;
        }

        var driverSubPathBin = path.join(driverDir, subdir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
        var driverPathBin = path.join(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));

        if (fs.existsSync(driverSubPathBin)) {
            fs.renameSync(driverSubPathBin, driverPathBin);
        }

        return driverDir;
    }

    chmodChromeDriver(driverDir) {
        return new Promise((resolve, reject) => {
            try {
                var driverBin = path.resolve(driverDir, 'chromedriver' + (process.platform === 'win32' ? '.exe' : ''));
                // chmod +x on POSIX
                if (process.platform !== 'win32') {
                    console.log('chmod +x ' + driverBin);
                    fs.chmod(driverBin, fs.constants.S_IXUSR | fs.constants.S_IXGRP, err => {
                        if (err) {
                            console.log('fs.chmod error', err);
                            resolve(err);
                        } else {
                            resolve(driverBin);
                        }
                    });
                } else {
                    resolve(driverBin);
                }
            } catch (error) {
                console.log('chmodChromeDriver error', error);
                resolve(error);
            }
        });
    }

    chmodEdgeDriver(driverDir) {
        return new Promise((resolve, reject) => {
            try {
                var driverBin = path.resolve(driverDir, 'msedgedriver' + (process.platform === 'win32' ? '.exe' : ''));
                // chmod +x on POSIX
                if (process.platform !== 'win32') {
                    console.log('chmod +x ' + driverBin);
                    fs.chmod(driverBin, fs.constants.S_IXUSR | fs.constants.S_IXGRP, err => {
                        if (err) {
                            console.log('fs.chmod error', err);
                            resolve(err);
                        } else {
                            resolve(driverBin);
                        }
                    });
                } else {
                    resolve(driverBin);
                }
            } catch (error) {
                console.log('chmodEdgeDriver error', error);
                resolve(error);
            }
        });
    }
    
    async downloadEdgeDriver(driverVersion) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const downloadUrl = this.getEdgeDriverDownloadUrl(driverVersion);
                console.log('Downloading ' + downloadUrl);

                if (downloadUrl) {
                    try {
                        await this._killEdgeDriverProcess();
                    } catch (error) {
                        console.log('_killEdgeDriverProcess error', error);
                    }
    
                    let zipPath;
                    try {
                        zipPath = await this.fetchDriver(downloadUrl);
                    } catch (error) {
                        resolve(error);
                    }

                    if (zipPath) {
                        if (zipPath instanceof Error) {
                            resolve(zipPath);
                        } else {
                            let driverDir;

                            try {
                                driverDir = await this.decompressZip(driverVersion, zipPath, EDGE_FOLDER_START);
                            } catch (error) {
                                resolve(error);
                            }

                            if (driverDir) {
                                if (driverDir instanceof Error) {
                                    resolve(driverDir);
                                } else {
                                    let driverBin;
                                    
                                    try {
                                        driverBin = await this.chmodEdgeDriver(driverDir);
                                    } catch (error) {
                                        resolve(error);
                                    }

                                    if (driverBin) {
                                        // Final stage
                                        resolve(driverBin);
                                    } else {
                                        resolve(new Error('driverBin is not defined', driverBin));
                                    }
                                }
                            } else {
                                resolve(new Error('driverDir is not defined', driverDir));
                            }
                        }
                    } else {
                        resolve(new Error('zipPath is not defined', zipPath));
                    }
                } else {
                    resolve(new Error('downloadUrl is not defined', downloadUrl));
                }
            } catch (error) {
                console.log('downloadEdgeDriver error', error);
                resolve(error);
            }
        });
    }

    async downloadChromeDriver(driverVersion) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            try {
                const downloadUrl = this.getChromeDriverDownloadUrl(driverVersion);
                console.log('Downloading ' + downloadUrl);

                if (downloadUrl) {
                    try {
                        await this._killChromeDriverProcess();
                    } catch (error) {
                        console.log('_killChromeDriverProcess error', error);
                    }
    
                    let zipPath;
                    try {
                        zipPath = await this.fetchDriver(downloadUrl);
                    } catch (error) {
                        resolve(error);
                    }

                    if (zipPath) {
                        if (zipPath instanceof Error) {
                            resolve(zipPath);
                        } else {
                            let driverDir;

                            try {
                                driverDir = await this.decompressZip(driverVersion, zipPath, CHROMEDRIVER_FOLDER_START);
                            } catch (error) {
                                resolve(error);
                            }

                            if (driverDir) {
                                if (driverDir instanceof Error) {
                                    resolve(driverDir);
                                } else {
                                    let driverBin;
                                    
                                    try {
                                        driverBin = await this.chmodChromeDriver(driverDir);
                                    } catch (error) {
                                        resolve(error);
                                    }

                                    if (driverBin) {
                                        // Final stage
                                        resolve(driverBin);
                                    } else {
                                        resolve(new Error('driverBin is not defined', driverBin));
                                    }
                                }
                            } else {
                                resolve(new Error('driverDir is not defined', driverDir));
                            }
                        }
                    } else {
                        resolve(new Error('zipPath is not defined', zipPath));
                    }
                } else {
                    resolve(new Error('downloadUrl is not defined', downloadUrl));
                }
            } catch (error) {
                console.log('downloadChromeDriver error', error);
                resolve(error);
            }
        });
    }
}
