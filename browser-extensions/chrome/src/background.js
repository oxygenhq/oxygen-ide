/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
const IDE_URL_HTTP = 'http://localhost:7778';
const IDE_URL_HTTPS = 'https://localhost:8889';

const MENU_ID_WAITFORTEXT = 'waitForText';
const MENU_ID_WAITFORVALUE = 'waitForValue';
const MENU_ID_WAITFOREXIST = 'waitForExist';
const MENU_ID_ASSERTTEXT = 'assertText';
const MENU_ID_ASSERVALUE = 'assertValue';
const MENU_ID_ASSERTITLE = 'assertTitle';

const PING_INTERVAL = 1000;

var isIdeRecording = false;
var isIdeRecordingPrev = false;

// prevent Content Security Policy by removing CSP response headers
var filter = {
    urls: ['*://*/*'],
    types: ['main_frame', 'sub_frame', 'xmlhttprequest']
};
chrome.webRequest.onHeadersReceived.addListener(onHeadersReceived, filter, ['blocking', 'responseHeaders']);

function onHeadersReceived(details) {
    for (var i = 0; i < details.responseHeaders.length; i++) {
        if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy') {
            details.responseHeaders[i].value = '';
        }
    }
    return { responseHeaders: details.responseHeaders };
};

// disable browser action on browser start
chrome.browserAction.disable();

// setup context menu for page
chrome.contextMenus.create({
    id: MENU_ID_WAITFORTEXT,
    enabled: false,
    title: 'Wait for Text',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    id: MENU_ID_WAITFORVALUE,
    enabled: false,
    title: 'Wait for Value',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    id: MENU_ID_WAITFOREXIST,
    enabled: false,
    title: 'Wait for Element',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    type: 'separator',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    id: MENU_ID_ASSERTTEXT,
    enabled: false,
    title: 'Assert Text',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    id: MENU_ID_ASSERVALUE,
    enabled: false,
    title: 'Assert Value',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});
chrome.contextMenus.create({
    id: MENU_ID_ASSERTITLE,
    enabled: false,
    title: 'Assert Title',
    documentUrlPatterns: ['<all_urls>'],
    contexts: ['page', 'frame', 'selection', 'link', 'editable', 'image', 'video', 'audio']
});

let port;

chrome.contextMenus.onClicked.addListener((info) => {
    port.postMessage({ action: info.menuItemId });
});

chrome.runtime.onConnect.addListener((_port) => {
    port = _port;
});

// check periodically whether we are recording and enable/disable the browser action accordingly
// TODO: evaluate if https://developer.chrome.com/apps/nativeMessaging can be used instead
setInterval(() => checkIfRecordingIsActive(), PING_INTERVAL);

function checkIfRecordingIsActive() {
    try {
        var req = new XMLHttpRequest();
        req.open('GET', IDE_URL_HTTP + '/ping');
        req.timeout = PING_INTERVAL - 100;  // should be less than polling interval
        req.onload = function (e) {
            if (req.readyState === 4) {
                isIdeRecordingPrev = isIdeRecording;
                isIdeRecording = req.status === 200;
                toggleExtension();
            }
        };
        req.onerror = function (e) {
        };
        req.ontimeout = function (e) {
            isIdeRecordingPrev = isIdeRecording;
            isIdeRecording = false;
            toggleExtension();
        };
        req.send();
    } catch (e) {
        isIdeRecordingPrev = isIdeRecording;
        isIdeRecording = false;
    } finally {
        if (isIdeRecording && !isIdeRecordingPrev) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { cmd: 'INJECT_RECORDER' });
            });
        }
        toggleExtension();
    }
}

function toggleExtension() {
    // prevent unnecessary toggling
    if (isIdeRecordingPrev === isIdeRecording) {
        return;
    }

    if (isIdeRecording) {
        chrome.browserAction.enable();
    } else {
        chrome.browserAction.disable();
    }

    chrome.contextMenus.update(MENU_ID_WAITFORTEXT, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_WAITFORVALUE, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_WAITFOREXIST, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERTTEXT, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERVALUE, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERTITLE, { enabled: isIdeRecording });
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.cmd === 'IS_RECORDING') {
        sendResponse({ result: isIdeRecording });
    } else {
        sendResponse({ result: 'error', message: 'invalid cmd' });
    }
    return true;
});

chrome.webNavigation.onCommitted.addListener(function(details) {
    if (!isIdeRecording) {
        return;
    }
    var transType = details.transitionType;

    if (transType === 'typed' || 
        transType === 'auto_bookmark' || 
        transType === 'generated' ||
        transType === 'reload') {

        // ignore internal Google Chrome urls
        if (details.url.indexOf('/_/chrome/newtab') > -1 ||
            details.url.startsWith('chrome:') ||
            details.url.startsWith('chrome-search:')) {
            return;
        }

        var data = JSON.stringify([{
            module: 'web',
            cmd: 'open',
            target: details.url,
            timestamp: (new Date()).getTime()
        }]);

        try {
            var req = new XMLHttpRequest();
            req.open('POST', details.url.startsWith('https:') ? IDE_URL_HTTPS : IDE_URL_HTTP);
            req.onload = function (e) {
                if (req.readyState === 4 && req.status != 200) {
                    console.error('ox: error sending open cmd: ' + req.statusText);
                }
            };
            req.onerror = function (e) {
                console.error('ox: error sending open cmd: ' + req.statusText);
            };
            req.send(data);
        } catch (e) {
            console.error('ox: error sending open cmd: ', e);
        }
    }
});
