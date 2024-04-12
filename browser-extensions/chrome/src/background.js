/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
const IDE_URL_HTTP = 'http://localhost:7778';

const SETTINGS_DEBUG = 'SETTINGS_DEBUG';

const MENU_ID_WAITFORTEXT = 'waitForText';
const MENU_ID_WAITFORVALUE = 'waitForValue';
const MENU_ID_WAITFOREXIST = 'waitForExist';
const MENU_ID_ASSERTTEXT = 'assertText';
const MENU_ID_ASSERVALUE = 'assertValue';
const MENU_ID_ASSERTITLE = 'assertTitle';
const MENU_ID_SEPARATOR = 'separator';

const PING_INTERVAL = 1000;
const XHR_TIMEOUT = 2000;

var isIdeRecording = false;
var isIdeRecordingPrev = false;

var debuggingEnabled = false;

var lastWindow = null;
var windowGroups = [];

// prevent Content Security Policy by removing CSP response headers
var filter = {
    urls: ['*://*/*'],
    types: ['main_frame', 'sub_frame', 'xmlhttprequest']
};

chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((e) => {
  const msg = `Navigation blocked to ${e.request.url} on tab ${e.request.tabId}.`;
  console.log(msg);
});

//chrome.webRequest.onHeadersReceived.addListener(headersReceived, filter, ['blocking', 'responseHeaders']);

function headersReceived(details) {
    for (var i = 0; i < details.responseHeaders.length; i++) {
        if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy') {
            details.responseHeaders[i].value = '';
        }
    }
    return { responseHeaders: details.responseHeaders };
};

console.log('=-======================================================: ' + chrome.action);

// disable browser action on browser start
//chrome.action.disable();

// setup context menu for browser_action
chrome.contextMenus.create({
    id: SETTINGS_DEBUG,
    type: 'checkbox',
    title: 'Enable debug logs',
    contexts: ['browser_action']
});

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
    id: MENU_ID_SEPARATOR,
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
    if (info.menuItemId === SETTINGS_DEBUG) {
        debuggingEnabled = info.checked;
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs.length >= 1) {
                chrome.tabs.sendMessage(tabs[0].id, { cmd: info.menuItemId, settings: { debuggingEnabled: debuggingEnabled } });
            }
        });
    } else {
        port.postMessage({ action: info.menuItemId });
    }
});

chrome.runtime.onConnect.addListener((_port) => {
    port = _port;
});

// check periodically whether we are recording and enable/disable the browser action accordingly
// TODO: evaluate if https://developer.chrome.com/apps/nativeMessaging can be used instead
setInterval(() => checkIfRecordingIsActive(), PING_INTERVAL);

function checkIfRecordingIsActive() {
    try {


        fetch(IDE_URL_HTTP + '/ping')
          .then(response => {
            console.log('##################################### response')
            if (response.ok) {
                isIdeRecordingPrev = isIdeRecording;
                isIdeRecording = true;
                toggleExtension();
            } else {
                isIdeRecording = false;
                toggleExtension();
            }
          })
          .then(data => {
             console.log('##################################### data')
            // Do something with the data
          })
          .catch(error => {
             console.log('##################################### error')
            isIdeRecording = false;
            toggleExtension();
          });





       /* var req = new XMLHttpRequest();
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
        req.send();*/
    } catch (e) {
        isIdeRecordingPrev = isIdeRecording;
        isIdeRecording = false;
    } finally {
        if (isIdeRecording && !isIdeRecordingPrev) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs && tabs.length >= 1) {
                    chrome.tabs.sendMessage(tabs[0].id, { cmd: 'INJECT_RECORDER', settings: { debuggingEnabled: debuggingEnabled } });
                }
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
        chrome.action.enable();
    } else {
        chrome.action.disable();
    }

    chrome.contextMenus.update(MENU_ID_WAITFORTEXT, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_WAITFORVALUE, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_WAITFOREXIST, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERTTEXT, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERVALUE, { enabled: isIdeRecording });
    chrome.contextMenus.update(MENU_ID_ASSERTITLE, { enabled: isIdeRecording });
}

function postToIDEAsync(url, data) {
    try {
        fetch(url,  
        {
            method: "POST"
        })
          .then(response => {
            if (response.ok) {
                
            } else {
                console.warn('ox: error posting to ' + url + ': ' + req.statusText);
            }
          })
          .then(data => {
            // Do something with the data
          })
          .catch(error => {
            console.warn('ox: error posting to ' + url + ': ' + req.statusText);
          });



        /*var req = new XMLHttpRequest();
        req.open('POST', url);
        req.timeout = XHR_TIMEOUT;
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status != 200) {
                console.warn('ox: error posting to ' + url + ': ' + req.statusText);
            }
        };
        req.send(data);*/
    } catch (e) {
        console.warn('ox: error posting to ' + url + ': ' + e);
    }
}

function lastWindowUpdate(newLastWin) {
    var tmpLastWin = lastWindow;
    lastWindow = newLastWin;

    // find top window for the previous window
    var top;
    for (var group of windowGroups) {
        if (group.indexOf(tmpLastWin) >= 0) {
            top = group.substring(group.length - 20);
            break;
        }
    }
    // check whether new window has same top as the previous one
    var sameGroup = false;
    for (var group of windowGroups) {
        if (group.indexOf(newLastWin) >= 0 && group.indexOf(top) >= 0) {
            sameGroup = true;
        }
    }

    return {
        hash: tmpLastWin ? tmpLastWin : '',
        sameGroup: sameGroup
    };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.cmd === 'IS_RECORDING') {
        sendResponse({ result: isIdeRecording, settings: { debuggingEnabled: debuggingEnabled } });
    } else if (msg.cmd === 'RECORDER_LASTWIN') {
        if (!lastWindow) {
            lastWindow = msg.data;
        }
    } else if (msg.cmd === 'RECORDER_WINDOW_GROUP_ADD') {
        windowGroups.push(msg.data);
    } else if (msg.cmd === 'RECORDER_COMMAND') {
        postToIDEAsync(IDE_URL_HTTP, msg.data);
    } else if (msg.cmd === 'RECORDER_LASTWIN_UPDATE') {
        var lw = lastWindowUpdate(msg.data);
        sendResponse({ result: lw });
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
        transType === 'reload' ||
        (transType === 'link' && details.transitionQualifiers.includes('from_address_bar'))) {

        // ignore internal Google Chrome urls
        if (details.url.indexOf('/_/chrome/newtab') > -1 ||
            details.url.startsWith('chrome:') ||
            details.url.startsWith('chrome-search:')) {
            return;
        }

        // FIXME note:
        // chrome sometimes produces two events when entering URL into address bar and pressing enter:
        // link and typed
        // as the result, web.open will be recorded twice
        // this cannot be reliably fixed in the extension itself
        // and needs to be looked at the IDE side...

        var data = JSON.stringify([{
            module: 'web',
            cmd: 'open',
            target: details.url,
            timestamp: (new Date()).getTime()
        }]);

        try {

            fetch(IDE_URL_HTTP,  
            {
                method: "POST"
            })
          .then(response => {
            if (response.ok) {
                
            } else {
                console.error('ox: error sending open cmd: ' + response);
            }
          })
          .then(data => {
            // Do something with the data
          })
          .catch(error => {
            console.error('ox: error sending open cmd: ' + error);
          });






           /* var req = new XMLHttpRequest();
            req.open('POST', IDE_URL_HTTP);
            req.onload = function (e) {
                if (req.readyState === 4 && req.status != 200) {
                    console.error('ox: error sending open cmd: ' + req.statusText);
                }
            };
            req.onerror = function (e) {
                console.error('ox: error sending open cmd: ' + req.statusText);
            };
            req.send(data);*/
        } catch (e) {
            console.error('ox: error sending open cmd: ', e);
        }
    }
});
