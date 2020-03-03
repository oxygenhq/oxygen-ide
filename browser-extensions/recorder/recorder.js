/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Based on:
 * Copyright 2005 Shinya Kasatani. Licensed under the Apache License, Version 2.0
 */

function Recorder() {
    // don't attach if already attached
    if (!('__hash' in window)) {
        window.__hash = Recorder.guid(); // generate unique id for this window
        this.attach();
    }
}

Recorder.cmdPrepare = function(command, target, value) {
    // omit empty values from serialization except for commands which actually can have empty values
    if (value === '' &&
        command != 'type' &&
        !command.startsWith('assert') &&
        !command.startsWith('waitFor')) {
        value = null;
    }
    
    // target is an array containing all available locators or a string for commands which doesn't
    // use locator in the target parameter
    var trg, trgLocs;
    if (target && target.constructor === Array) {
        // escape backslashes in CSS locators (if CSS was escaped due to illigal chars)
        for (var locator of target) {
            if (locator[1] === 'css') {
                locator[0] = locator[0].replace(/\\/g, '\\\\');
                break;
            }
        }
        trg = target[0][0];
        trgLocs = target;
    } else {
        trg = target;
        trgLocs = null;
    }

    // if primary locator is potentially a dynamic one - try to find another one
    // locator potentially dynamic if it has 3+ digit number in it.
    var regex = /[0-9]{3,}/;
    if (trgLocs && regex.test(trg) === true) {
        for (var i = 0; i < target.length; i++) {
            if (!regex.test(target[i][0])) {
                trg = target[i][0];
                break;
            }
        }
    }

    return {
        module: 'web',
        cmd: command,
        target: trg,
        targetLocators: trgLocs,
        value: value,
        timestamp: (new Date()).getTime()
    };
};

Recorder.prototype.parseEventKey = function(eventKey) {
    if (eventKey.match(/^C_/)) {
        return { eventName: eventKey.substring(2), capture: true };
    } else {
        return { eventName: eventKey, capture: false };
    }
};

Recorder.prototype.attach = function() {
    ox_log('attaching to ' + window.__hash);

    this.locatorBuilders = new LocatorBuilders(window);
    var self = this;
    for (var eventKey in Recorder.eventHandlers) {
        var eventInfo = this.parseEventKey(eventKey);
        var eventName = eventInfo.eventName;
        var capture = eventInfo.capture;
        // create new function so that the variables have new scope.
        function register() {
            var handler = Recorder.eventHandlers[eventKey];
            var listener = function(event) {
                handler.call(self, event);
            };
            window.document.addEventListener(eventName, listener, capture);
        }
        register.call(this);
    }

    // store initial window handle only for top level windows
    if (window.parent == window) {
        window.postMessage(JSON.stringify({cmd: 'RECORDER_LASTWIN', data: window.__hash }), '*');
    }

    this.__specialKeyCodes = {
        Backspace: '\\uE003',
        Clear: '\\uE005',
        Return: '\\uE006',
        Enter: '\\uE007',
        End: '\\uE010',
        Home: '\\uE011',
        ArrowLeft: '\\uE012',
        ArrowUp: '\\uE013',
        ArrowRight: '\\uE014',
        ArrowDown: '\\uE015',
        Delete: '\\uE017'
    };
};

Recorder.prototype.record = function (command, target, value) {
    // in case no locators were generated
    if (!target) {
        return;
    }

    if (!this._ox_command) {
        this._ox_command = [];
    }
    this._ox_command.push({
        command: command,
        target: target,
        value: value
    });

    window.postMessage(JSON.stringify({cmd: 'RECORDER_LASTWIN_UPDATE', data: window.__hash }), '*');
};

Recorder.prototype.recordNoLocators = function (command, target) {
    if (!this._ox_command) {
        this._ox_command = [];
    }
    this._ox_command.push({
        command: command,
        target: target
    });

    window.postMessage(JSON.stringify({cmd: 'RECORDER_LASTWIN_UPDATE', data: window.__hash }), '*');
};

Recorder.prototype.recordSendCommand = function (lastWindow) {
    var cmds = [];
    if (lastWindow) {
        var isTop = window.parent == window;
        var isSameOriginFrame = !isTop && window.frameElement != null;
        ox_log('testing for window transition prev:new ' + lastWindow.hash + ' : ' + window.__hash);
        if (lastWindow.hash != window.__hash) {
            if (isTop) {                                    // new top window
                ox_log('new window');
                var winLocator = window.document.title === '' ? '' : 'title=' + window.document.title;
                cmds.push(Recorder.cmdPrepare('selectWindow', winLocator, null));
            } else if (lastWindow.sameGroup) {              // same window, new frame
                ox_log('new frame. same window');
                if (window.__frameLocators) {
                    cmds.push(Recorder.cmdPrepare('selectFrame', window.__frameLocators, null));
                }
            } else {                                        // new window, new frame
                ox_log('new frame. new window');
                var winLocator = null;
                try {
                    winLocator = window.top.document.title === '' ? '' : 'title=' + window.parent.document.title;
                } catch (ignored) {
                }

                if (winLocator) {
                    cmds.push(Recorder.cmdPrepare('selectWindow', winLocator, null));
                } else {
                    ox_log('cannot get window title - frame and top window are of different origins');
                }
                if (window.__frameLocators) {
                    cmds.push(Recorder.cmdPrepare('selectFrame', window.__frameLocators, null));
                }
            }
        }
    }

    var validCommands = 0;
    if (this._ox_command) {
        cmdsLoop:
        for (var i = 0; i < this._ox_command.length; i++) {
            var c = this._ox_command[i];

            // ignore any actions on html and body elements 
            // as 'click' cannot be executed by webdriver on html or body
            // and assertText/waitForText sometimes erroneously generated for html/body pulling whole page html as text string
            if (c.target && c.target.constructor === Array && c.target.length > 0) {
                for (var s = 0; s < c.target.length; s++) {
                    var trg = c.target[s][0];
                    if (trg === 'css=body' ||
                        trg === 'css=html' ||
                        trg === '//body' ||
                        trg === '//html') {
                        continue cmdsLoop;
                    }
                }
            } else if (c.target && c.target.constructor === Array && c.target.length === 0) {
                // no locators were found
                continue;
            }

            cmds.push(Recorder.cmdPrepare(c.command, c.target, c.value));
            validCommands++;
        }
        delete this._ox_command;
    }

    if (validCommands === 0) {
        return;
    }

    var data = JSON.stringify(cmds, function (k, v) { return (v === null || v === undefined) ? undefined : v; });
    ox_log('' + data);

    window.postMessage(JSON.stringify({cmd: 'RECORDER_COMMAND', data: data }), '*');
};

Recorder.prototype.findLocator = function (element) {
    return this.locatorBuilders.build(element);
};

Recorder.prototype.findLocators = function (element) {
    return this.locatorBuilders.buildAll(element);
};

Recorder.addEventHandler = function(eventName, handler, capture) {
    var key = capture ? ('C_' + eventName) : eventName;
    this.eventHandlers[key] = handler;
};

Recorder.eventHandlers = {};

Recorder.guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4();
};

Recorder.inputTypes = ['text', 'password', 'file', 'datetime', 'datetime-local', 'date', 'month', 'time', 'week', 'number', 'range', 'email', 'url', 'search', 'tel', 'color'];
Recorder.addEventHandler('change', function (ev) {
    ox_log('change ev');
    var target = ev.target;
    
    if (target.tagName && !target.readOnly) {
        var tagName = target.tagName.toLowerCase();
        var type = target.type;
        if ('input' == tagName && Recorder.inputTypes.indexOf(type) >= 0 ||
            'textarea' == tagName) {
            this.__keysBuf = null; // prevent the 'keyup' workaround firing on 'focusout'
            if (target.value == this.activeElementValue) {    // value hasn't changed
                return;
            }
            // clear if new value is empty
            // we could also clear if there was a previous value - this.activeElementValue is truthy
            // but no need, since 'type''automatically clears previous value.
            if (target.value.length <= 0) {
                this.record('clear', this.findLocators(target), '');
            } else {
                this.record('type', this.findLocators(target), target.value.replace(/\\/g, '\\\\'));
            }
        } else if ('select' == tagName) {
            if (!target.multiple) {
                var option = target.options[target.selectedIndex];
                if (this.activeElementValue == option) {    // value did not change
                    return;
                }
                ox_log('selectedIndex=' + target.selectedIndex);
                this.record('select', this.findLocators(target), this.getOptionLocator(option));
            } else {
                ox_log('change selection on select-multiple');
                var options = target.options;
                for (var i = 0; i < options.length; i++) {
                    ox_log('option=' + i + ', ' + options[i].selected);
                    if (options[i]._wasSelected === null || options[i]._wasSelected === undefined) {
                        ox_log('_wasSelected was not recorded');
                    }
                    if (options[i]._wasSelected != options[i].selected) {
                        var value = this.getOptionLocator(options[i]);
                        if (options[i].selected) {
                            this.record('select', this.findLocators(target), value);
                        } else {
                            this.record('deselect', this.findLocators(target), value);
                        }
                        options[i]._wasSelected = options[i].selected;
                    }
                }
            }
        }
    }
});


Recorder.addEventHandler('focus', function (ev) {
    ox_log('focus ev');
    var target = ev.target;

    if (this.__keysBuf) {
        this.record('type', this.findLocators(this.__keysBuf.el), this.__keysBuf.keys.join(''));
        this.__keysBuf = null;
    }

    if (target.nodeName) {
        var tagName = target.nodeName.toLowerCase();
        if ('select' == tagName && target.multiple) {
            ox_log('focus ev remembering selections');
            var options = target.options;
            for (var i = 0; i < options.length; i++) {
                if (options[i]._wasSelected === null || options[i]._wasSelected === undefined) {
                    // is the focus was gained by mousedown event, _wasSelected would be already set
                    options[i]._wasSelected = options[i].selected;
                }
            }
        } else if (tagName === 'input' || tagName === 'textarea') {
            this.activeElementValue = target.value;
        }
    }
}, true);

// PointerEvent supported on Chrome 55+. allows us to record in responsive mode.
// https://developers.google.com/web/updates/2016/10/pointer-events
let inputType = window.PointerEvent ? 'pointer' : 'mouse';
let inputDown = inputType + 'down';
let inputUp = inputType + 'up';

Recorder.addEventHandler(inputDown, function (ev) {
    ox_log(inputDown + ' ev');
    var target = ev.target;
    this.__mouseDownTarget = {
        el: target,
        x: ev.clientX,
        y: ev.clientY
    };
    if (target.nodeName) {
        var tagName = target.nodeName.toLowerCase();
        if ('option' == tagName) {
            var parent = target.parentNode;
            if (parent.multiple) {
                ox_log(inputDown + ' ev remembering selections');
                var options = parent.options;
                for (var i = 0; i < options.length; i++) {
                    options[i]._wasSelected = options[i].selected;
                }
            }
        }
    }
}, true);

Recorder.addEventHandler(inputUp, function (ev) {
    ox_log(inputUp + ' ev');
    if (ev.button !== 0) {
        return;
    }
    var target = ev.target;

    // click event won't be produced if mouseUp happened on different element than mouseDown/pointerDown
    // this could happen when original element gets modified during mouseDown/pointerDown
    // hence we process mouseup/pointerup events instead of click
    var downTarget = this.__mouseDownTarget;
    if (downTarget && downTarget.el !== target) {
        // make sure user just tried to click and not drag-and-drop something
        // TODO: add separate handling for DnD cases.
        // 20px difference between down and up seems reasonable enough...
        var DISTANCE_THRESHOLD = 20;
        if (downTarget.x >= ev.clientX - DISTANCE_THRESHOLD &&
            downTarget.x <= ev.clientX + DISTANCE_THRESHOLD &&
            downTarget.y >= ev.clientY - DISTANCE_THRESHOLD &&
            downTarget.y <= ev.clientY + DISTANCE_THRESHOLD) {
            this.recordClick(downTarget.el);
        }
    } else {
        // click event will be produced, unless the element got removed from DOM.
        // e.g. custom drop down which get destroyed upon selection
        // hence we process mouseup events instead of click
        this.recordClick(target);
    }
    this.__mouseDownTarget = null;
}, true);

Recorder.prototype.meaningfulAttrs = new Set(['href', 'src', 'id', 'name', 'class', 'type', 'alt', 'title', 'value', 'action', 'onclick']);

/*
 * Used to save element's attributes so we can generate proper locators later on on click
 */
Recorder.addEventHandler('mouseover', function (ev) {
    var target = ev.target;

    this.__originalAttrs = {
        element: target,
        attrs: []
    };
    var attrs = target.attributes;
    for (var i = attrs.length - 1; i >= 0; i--) {
        if (this.meaningfulAttrs.has(attrs[i].name)) {
            this.__originalAttrs.attrs.push({name: attrs[i].name, value: attrs[i].value});
        }
    }
}, true);

Recorder.addEventHandler('mouseout', function (ev) {
    this.__originalAttrs = null;
}, true);

/*
 * Process context menu clicks.
 * 1. Notify 'content' that we got a contextMenu event on an element and have stored
 *    said element.
 * 2. 'content' will setup handler to receive the entry id from 'background'
 * 3. Once the id is received, 'content' notifies the page that it can proceed recording. i.e. sends
 *    CONTEXT_MENU_RECORD with with action name.
 */
Recorder.addEventHandler('contextmenu', function(ev){
    window.__contextmenuEl = ev.target;
    window.postMessage(JSON.stringify({type: 'CONTEXT_MENU'}), '*');
}, true);


// record keystrokes for situations when "change" event is not produced
// e.g. site handles keyup itself and prevents input's value changes
Recorder.addEventHandler('keyup', function (ev) {
    ox_log('keyup ev');
    var key = ev.key;
    var keycode = ev.keyCode;

    var specialKey = this.__specialKeyCodes[key];
    var isPrintable =
        (keycode > 47 && keycode < 58)   || // number keys
        keycode == 32 || keycode == 13   || // spacebar & return
        (keycode > 64 && keycode < 91)   || // letter keys
        (keycode > 95 && keycode < 112)  || // numpad keys
        (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
        (keycode > 218 && keycode < 223);   // [\]' (in order)

    if (!isPrintable && !specialKey) {
        return;
    }
    
    if (!this.__keysBuf) {
        this.__keysBuf = {
            el: ev.target,
            keys: []
        };
    }

    this.__keysBuf.keys.push(specialKey ? specialKey : key);
}, true);

Recorder.prototype.getOptionLocator = function (option) {
    return 'label=' + option.text.replace(/^ *(.*?) *$/, '$1');
};

Recorder.prototype.findClickableElement = function (e) {
    if (!e.tagName) {
        return null;
    }
    var tagName = e.tagName.toLowerCase();
    var type = e.type;
    if (e.getAttribute('onclick') !== null || e.getAttribute('href') !== null || tagName == 'button' ||
        (tagName == 'input' &&
         (type == 'submit' || type == 'button' || type == 'image' || type == 'radio' || type == 'checkbox' || type == 'reset'))) {
        return e;
    } else {
        if (e.parentNode) {
            return this.findClickableElement(e.parentNode);
        } else {
            return null;
        }
    }
};

Recorder.prototype.recordClick = function (target) {
    // since element could have its attributes changed before the actual click happens
    // e.g. class attribute changed when hovering over it before clicking
    // we try to restore the original attributes first before recording the click,
    // otherwise we will get wrong locators
    if (this.__originalAttrs && this.__originalAttrs.element === target) {
        var oldAttrs = this.__originalAttrs.attrs;
        var newAttrs = {};

        // restore original attributes
        for (var i = oldAttrs.length - 1; i >= 0; i--) {
            var old = oldAttrs[i];
            // restore only if the attribute value has changed
            if (target.getAttribute(old.name) !== old.value) {
                newAttrs[old.name] = target.getAttribute(old.name);
                target.setAttribute(old.name, old.value);
            }
        }

        this.record('click', this.findLocators(target), '');

        // revert attribute changes
        Object.keys(newAttrs).forEach(function(key) {
            target.setAttribute(key, newAttrs[key]);
        });
    } else {
        this.record('click', this.findLocators(target), '');
    }
};

_ox_recorder = new Recorder();

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
                    var locs = _ox_recorder.findLocators(frame);
                    e.source.postMessage(JSON.stringify({type: _ox_FRAME_LOCATORS, data: JSON.stringify(locs)}), '*');
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
