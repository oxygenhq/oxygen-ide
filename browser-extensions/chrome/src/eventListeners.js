/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * When dealing with windows/frames we need to solve two things - calculate frame locator and 
 * recognize window/frame transitions.
 * Due to limitations imposed by same origin policy, we need to handle this in a special way:
 *
 * Frame locators:
 * ---------------
 * Because frame's locator cannot be calculated from the frame itself, we calculate it inside the 
 * parent window and send back to the frame using postMessage.
 * FRAME_IS_READY message is sent to parent once the frame has finished setting up the listener 
 * which will receive its locator. Upon receiving this message, parent calculates frame locators and
 * sends it back to the frame.
 *
 * Recognizing window/frame transitions:
 * -------------------------------------
 * To be able to recognize whether a transition to a different window of frame or even both has 
 * happened, we need to keep track of two things - id of previous active window and something that
 * tells us which frame belongs to which top window.
 * This is done through WINDOW_GROUP. Frame sends the message to its parent with its id. Upon 
 * receiving it, the parent does the same. Eventually in the top we get a complete list of ids from
 * first frame to the top. This data is saved off browser.
 */
var _ox_FRAME_LOCATORS = 'FRAME_LOCATORS';
var _ox_FRAME_IS_READY = 'FRAME_IS_READY';
var _ox_WINDOW_GROUP = 'WINDOW_GROUP';

window.addEventListener(
    'message', 
    function(e) {
        // NOTE: messages are serialized and passed as strings since IE < 11 can pass only primitives
        var msg;
        try {
            msg = JSON.parse(e.data);
            if (!msg) {
                return;
            }
        } catch (err) {
            return; // ignore unparsable 3rd party messages from the page
        }

        if (msg.type === _ox_FRAME_LOCATORS) {
            e.stopPropagation();
            window.__frameLocators = JSON.parse(msg.data);
        } else if (msg.type === _ox_FRAME_IS_READY) {
            e.stopPropagation();
            // get all (i)frames in this document
            var framesAll = [];
            var frames = document.getElementsByTagName('frame');
            for (var i = 0; i < frames.length; i++) {
                framesAll.push(frames[i]);
            }
            var iframes = document.getElementsByTagName('iframe');
            for (var i = 0; i < iframes.length; i++) {
                framesAll.push(iframes[i]);
            }

            for (var i = 0; i < framesAll.length; i++) {
                var frame = framesAll[i];
                // is it "our" frame? i.e. the one that is ready to receive the locator
                if (frame.contentWindow === e.source) {
                    // ox_recorder is not available yet since it's initialized on document_end,
                    // and this handler inited on document_start, thus we pospone
                    setTimeout(function() {
                        var locs = _ox_recorder.findLocators(frame);
                        e.source.postMessage(JSON.stringify({type: _ox_FRAME_LOCATORS, data: JSON.stringify(locs)}), '*');
                    }, 1000);
                    break;
                }
            }
        } else if (msg.type === _ox_WINDOW_GROUP) {
            e.stopPropagation();
            var hash = msg.data + ',' + window.__hash;
            if (window.parent != window) {  // we are in a frame
                window.parent.postMessage(JSON.stringify({type: _ox_WINDOW_GROUP, data: hash}), '*');
            } else {                        // we have reached the top
                if (hash.length > 16) { // only if group contains more than one window 
                    window.postMessage(JSON.stringify({cmd: 'RECORDER_WINDOW_GROUP_ADD', data: hash }), '*');
                }
            }
        } else if (msg.type === 'CONTEXT_MENU_RECORD') { // not related to frames...
            e.stopPropagation();
            var el = window.__contextmenuEl;
            switch (msg.cmd) {
            case 'waitForText':
            case 'assertText':
                var txt = getText(el);
                if (!txt) {
                    ox_log('error: selected element doesn\'t have text');
                    return;
                }
                _ox_recorder.record(msg.cmd, _ox_recorder.findLocators(el), txt);
                break;
            case 'waitForValue':
            case 'assertValue':
                if (!el.getAttribute('value')) {
                    ox_log('error: selected element doesn\'t have value attribute');
                    return;
                }
                _ox_recorder.record(msg.cmd, _ox_recorder.findLocators(el), el.value);
                break;
            case 'waitForExist':
                _ox_recorder.record(msg.cmd, _ox_recorder.findLocators(el));
                break;
            case 'assertTitle':
                _ox_recorder.record(msg.cmd, document.title, null);
                break;
            }
        } else if (msg.type === 'SETTINGS_DEBUG') { // not related to frames...
            e.stopPropagation();
            window.ox_debug = msg.enable;
        } else if (msg.type === 'RECORD_COMMAND') { // not related to frames...
            e.stopPropagation();
            _ox_recorder.recordSendCommand(msg.lastWindow);
        } else if (msg.type === 'RECORD_ALERT') {
            e.stopPropagation();
            _ox_recorder.recordNoLocators(msg.cmd, msg.val);
            _ox_recorder.recordSendCommand();
        }
    },
    false
);
if (window.parent != window) {  // are we a frame?
    window.parent.postMessage(JSON.stringify({type: _ox_FRAME_IS_READY}), '*');
    window.parent.postMessage(JSON.stringify({type: _ox_WINDOW_GROUP, data: window.__hash}), '*');
}
