/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

chrome.runtime.sendMessage({ cmd: 'IS_RECORDING' }, (response) => {
    if (response && response.result === true) {
        window.ox_debug = response.settings.debuggingEnabled;
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.cmd === 'INJECT_RECORDER') {
        window.ox_debug = msg.settings.debuggingEnabled;
    } else if (msg.cmd === 'SETTINGS_DEBUG') {
        // NOTE: messages are serialized and passed as strings since IE < 11 can pass only primitives
        window.postMessage(JSON.stringify({ type: msg.cmd, enable: msg.settings.debuggingEnabled }), '*');
    }
});

// see comment inside recorder.js for contextmenu event handler
window.addEventListener(
    'message',
    function(e) {
        var msg;
        try {
            msg = JSON.parse(e.data);
            if (!msg) {
                return;
            }
        } catch (err) {
            return; // ignore unparsable 3rd party messages from the page
        }

        if (msg.type === 'CONTEXT_MENU') {
            e.stopPropagation();
            var port = chrome.runtime.connect();

            var handler = (msg) => {
                e.source.postMessage(JSON.stringify({
                    type: 'CONTEXT_MENU_RECORD',
                    cmd: msg.action
                }), '*');
                port.onMessage.removeListener(this);
            };

            // There can be only one! --Highlander
            port.onMessage.removeListener(handler);
            port.onMessage.addListener(handler);
        } else if (msg.cmd === 'RECORDER_LASTWIN') {
            e.stopPropagation();
            chrome.runtime.sendMessage(msg);
        } else if (msg.cmd === 'RECORDER_WINDOW_GROUP_ADD') {
            e.stopPropagation();
            chrome.runtime.sendMessage(msg);
        } else if (msg.cmd === 'RECORDER_COMMAND') {
            e.stopPropagation();
            chrome.runtime.sendMessage(msg);
        } else if (msg.cmd === 'RECORDER_LASTWIN_UPDATE') {
            e.stopPropagation();
            /*
                1. JS posts RECORDER_LASTWIN_UPDATE to Content
                2. Content relays the message to Background
                3. Background sends lastwin_update to IDE
                3. Background receives reply from IDE and replies to Content
                5. Content posts RECORD_COMMAND to JS with lastWindow data
                6. JS generates selectWindow/selectFrame if needed, and posts the command to Content
                7. Content relays the message to Background
                8. Background sends to IDE
            */
            chrome.runtime.sendMessage(msg, (response) => {
                e.source.postMessage(JSON.stringify({
                    type: 'RECORD_COMMAND',
                    lastWindow: response.result
                }), '*');
            });
        }
    },
    false
);

function enableLogging(debuggingEnabled) {
    window.ox_debug = debuggingEnabled;
}

(function() {
    var s = document.createElement('script');
    s.innerHTML = `
        this.windowMethods = {
            alert: window.alert,
            confirm: window.confirm,
            prompt: window.prompt,
        };
        var self = this;
        window.alert = function(alert) {
            self.windowMethods.alert.call(self.window, alert);
            window.postMessage(JSON.stringify({ type: 'RECORD_ALERT', cmd: 'assertAlert', val: alert }), '*');
        };
        window.confirm = function(message) {
            var result = self.windowMethods.confirm.call(self.window, message);
            window.postMessage(JSON.stringify({ type: 'RECORD_ALERT', cmd: result ? 'acceptAlert' : 'dismissAlert' }), '*');
            return result;
        };
        window.prompt = function(message) {
            var result = self.windowMethods.prompt.call(self.window, message);
            window.postMessage(JSON.stringify({ type: 'RECORD_ALERT', cmd: 'acceptAlert' }), '*');
            return result;
        };`;
    document.body.appendChild(s);
})();

if (window.parent != window) {  // are we a frame?
    window.parent.postMessage(JSON.stringify({type: 'FRAME_IS_READY'}), '*');
    window.parent.postMessage(JSON.stringify({type: 'WINDOW_GROUP', data: window.__hash}), '*');
}
