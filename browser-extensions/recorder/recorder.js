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
    if (target.constructor === Array) {
        trg = target[0][0];
        trgLocs = target;
    } else {
        trg = target;
        trgLocs = null;
    }

    // if primary locator is potentially a dynamic one - try to find another one
    // locator potentially dynamic if it has 3+ digit number in it.
    var regex = /[0-9]{3,}/;
    if (regex.test(trg) === true) {
        for (var i = 0; i < target.length; i++) {!regex.test(target[i][0])
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
    ox_log('ox: attaching to ' + window.__hash);

    this.locatorBuilders = new LocatorBuilders(window);
    this.attachWindowMethods();
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
        var xhr = new XMLHttpRequest();
        xhr.open('POST', Recorder.GetIdeUrl() + '/lastwin_attach');
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status != 200) {
                console.error('ox: error on lastwin_attach: ' + xhr.statusText);
            }
        };
        xhr.send(window.__hash);
    }

    this.initializeFrameHorrors();

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

Recorder.prototype.attachWindowMethods = function() {
    this.windowMethods = {};
    ['alert', 'confirm', 'prompt', 'open'].forEach(function(method) {
            this.windowMethods[method] = window[method];
        }, this);
    var self = this;
    window.alert = function(alert) {
        self.windowMethods.alert.call(self.window, alert);
        self.record('assertAlert', alert);
    };
    window.confirm = function(message) {
        var result = self.windowMethods.confirm.call(self.window, message);
        if (!result) {
            self.record('chooseCancelOnNextConfirmation', null, null, true);
        }
        self.record('assertConfirmation', message);
        return result;
    };
    window.prompt = function(message) {
        var result = self.windowMethods.prompt.call(self.window, message);
        self.record('answerOnNextPrompt', result, null, true);
        self.record('assertPrompt', message);
        return result;
    };
};

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
Recorder.prototype.initializeFrameHorrors = function() {
    var FRAME_LOCATORS = 'FRAME_LOCATORS';
    var FRAME_IS_READY = 'FRAME_IS_READY';
    var WINDOW_GROUP = 'WINDOW_GROUP';

    var self = this;
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

            if (msg.type === FRAME_LOCATORS) {
                window.__frameLocators = JSON.parse(msg.data);
            } else if (msg.type === FRAME_IS_READY) {
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
                        var locs = self.findLocators(frame);
                        e.source.postMessage(JSON.stringify({type: FRAME_LOCATORS, data: JSON.stringify(locs)}), '*');
                        break;
                    }
                }
            } else if (msg.type === WINDOW_GROUP) {
                var hash = msg.data + ',' + window.__hash;
                if (window.parent != window) {  // we are in a frame
                    window.parent.postMessage(JSON.stringify({type: WINDOW_GROUP, data: hash}), '*');
                } else {                        // we have reached the top
                    if (hash.length > 16) { // only if group contains more than one window 
                        xhr = new XMLHttpRequest();
                        xhr.open('POST', Recorder.GetIdeUrl()+ '/windowgroup_add' );
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4 && xhr.status != 200) {
                                console.error('ox: error on windowgroup_add: ' + xhr.statusText);
                            }
                        };
                        xhr.send(hash);
                    }
                }
            } else if (msg.type === 'CONTEXT_MENU_RECORD') { // not related to frames...
                var el = self.__contextmenuEl;
                switch (msg.cmd) {
                    case 'waitForText':
                    case 'assertText':
                        var txt = getText(el);
                        if (!txt) {
                            ox_log('ox: error: selected element doesn\'t have text');
                            return;
                        }
                        self.record(msg.cmd, self.findLocators(el), txt);
                        break;
                    case 'waitForValue':
                    case 'assertValue':
                        if (!el.getAttribute('value')) {
                            ox_log('ox: error: selected element doesn\'t have value attribute');
                            return;
                        }
                        self.record(msg.cmd, self.findLocators(el), el.value);
                        break;
                    case 'waitForExist':
                        self.record(msg.cmd, self.findLocators(el));
                        break;
                    case 'assertTitle':
                        self.record(msg.cmd, document.title, null);
                        break;
                }
            } else if (msg.type === 'SETTINGS_DEBUG') { // not related to frames...
                window.ox_debug = msg.enable;
            }
        },
        false
    );
    if (window.parent != window) {  // are we a frame?
        window.parent.postMessage(JSON.stringify({type: FRAME_IS_READY}), '*');
        window.parent.postMessage(JSON.stringify({type: WINDOW_GROUP, data: window.__hash}), '*');
    }
}

Recorder.prototype.record = function (command, target, value) {
    // in case no locators were generated
    if (!target) {
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open('POST', Recorder.GetIdeUrl() + '/lastwin_update', false);
    xhr.send(window.__hash);
    if (xhr.status != 200) {
        console.error('ox: error on lastwin_update: ' + xhr.statusText);
    } else {
        var cmds = [];
        if (xhr.responseText) {
            var lastWindow = JSON.parse(xhr.responseText);
            var isTop = window.parent == window;
            var isSameOriginFrame = !isTop && window.frameElement != null;
            ox_log('ox: testing for window transition prev:new ' + lastWindow.hash + ' : ' + window.__hash);
            if (lastWindow.hash != window.__hash) {
                if (isTop) {                                    // new top window
                    ox_log('ox: new window');
                    var winLocator = window.document.title === '' ? '' : 'title=' + window.document.title;
                    cmds.push(Recorder.cmdPrepare('selectWindow', winLocator, null));
                } else if (lastWindow.sameGroup) {              // same window, new frame
                    ox_log('ox: new frame. same window');
                    if (window.__frameLocators) {
                        cmds.push(Recorder.cmdPrepare('selectFrame', window.__frameLocators, null));
                    }
                } else {                                        // new window, new frame
                    ox_log('ox: new frame. new window');
                    var winLocator = null;
                    try {
                        winLocator = window.top.document.title === '' ? '' : 'title=' + window.parent.document.title;
                    } catch (ignored) {
                    }

                    if (winLocator) {
                        cmds.push(Recorder.cmdPrepare('selectWindow', winLocator, null));
                    } else {
                        console.error('ox: cannot get window title - frame and top window are of different origins');
                    }
                    if (window.__frameLocators) {
                        cmds.push(Recorder.cmdPrepare('selectFrame', window.__frameLocators, null));
                    }
                }
            }
        }

        cmds.push(Recorder.cmdPrepare(command, target, value));

        // ignore any actions on html and body elements 
        // as 'click' cannot be executed by webdriver on html or body
        // and assertText/waitForText sometimes erroneously generated for html/body pulling whole page html as text string
        for (var i = 0; i < cmds.length; i++) {
            var c = cmds[i];
            if (c.target === 'css=body' ||
                c.target === 'css=html' ||
                c.target === '//body' ||
                c.target === '//html') {
                return;
            }
        }

        var data = JSON.stringify(cmds, function (k, v) { return (v === null || v === undefined) ? undefined : v; });
        ox_log('ox: ' + data);

        xhr = new XMLHttpRequest();
        xhr.open('POST', Recorder.GetIdeUrl(), false);
        xhr.send(data);
        if (xhr.status != 200) {
            console.error('ox: error sending command: ' + xhr.statusText);
        }
    }
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

Recorder.GetIdeUrl = function() {
    return location.protocol === 'https:' ? 'https://localhost:8889' : 'http://localhost:7778';
};

Recorder.guid = function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }
    return s4() + s4() + s4() + s4();
};

Recorder.inputTypes = ['text', 'password', 'file', 'datetime', 'datetime-local', 'date', 'month', 'time', 'week', 'number', 'range', 'email', 'url', 'search', 'tel', 'color'];
Recorder.addEventHandler('change', function (ev) {
    ox_log('ox: change ev');
    var target = ev.target;

    if (target.tagName) {
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
                ox_log('ox: selectedIndex=' + target.selectedIndex);
                this.record('select', this.findLocators(target), this.getOptionLocator(option));
            } else {
                ox_log('ox: change selection on select-multiple');
                var options = target.options;
                for (var i = 0; i < options.length; i++) {
                    ox_log('ox: option=' + i + ', ' + options[i].selected);
                    if (options[i]._wasSelected === null || options[i]._wasSelected === undefined) {
                        ox_log('ox: _wasSelected was not recorded');
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
    ox_log('ox: focus ev');
    var target = ev.target;

    if (this.__keysBuf) {
        this.record('type', this.findLocators(this.__keysBuf.el), this.__keysBuf.keys.join(''));
        this.__keysBuf = null;
    }

    if (target.nodeName) {
        var tagName = target.nodeName.toLowerCase();
        if ('select' == tagName && target.multiple) {
            ox_log('ox: focus ev remembering selections');
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

Recorder.addEventHandler('mousedown', function (ev) {
    ox_log('ox: mousedown ev');
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
                ox_log('ox: mousedown ev remembering selections');
                var options = parent.options;
                for (var i = 0; i < options.length; i++) {
                    options[i]._wasSelected = options[i].selected;
                }
            }
        }
    }
}, true);

Recorder.addEventHandler('mouseup', function (ev) {
    ox_log('ox: mouseup ev');
    if (ev.button !== 0) {
        return;
    }
    var target = ev.target;

    // click event won't be produced if mouseUp happened on different element than mouseDown
    // this could happen when original element gets modified during mouseDown.
    // hence we process mouseup events instead of click
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
        this.__originalAttrs.attrs.push({name: attrs[i].name, value: attrs[i].value});
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
    this.__contextmenuEl = ev.target;
    window.postMessage(JSON.stringify({type: 'CONTEXT_MENU'}), '*');
}, true);


// record keystrokes for situations when "change" event is not produced
// e.g. site handles keyup itself and prevents input's value changes
Recorder.addEventHandler('keyup', function (ev) {
    ox_log('ox: keyup ev');
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

        for (var i = oldAttrs.length - 1; i >= 0; i--) {
            var old = oldAttrs[i];
            newAttrs[old.name] = target.getAttribute(old.name);
            target.setAttribute(old.name, old.value);
        }

        this.record('click', this.findLocators(target), '');

        // revert attribute changes
        Object.keys(newAttrs).forEach(function(key) {
            target.setAttribute(key, newAttrs[key]); ;
        });
    } else {
        this.record('click', this.findLocators(target), '');
    }
};

new Recorder();
