/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

chrome.runtime.sendMessage({ cmd: 'IS_RECORDING' }, (response) => {
    if (response && response.result === true) {
        injectRecorder()
    }
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.cmd === 'INJECT_RECORDER') {
        injectRecorder();
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
        }
    },
    false
);

function injectRecorder() {
    console.log('ox: injecting recorder');
    var script = document.createElement('script');
    script.src = chrome.extension.getURL('recorder.js');
    (document.head || document.body).appendChild(script);
    script.parentNode.removeChild(script);
}
