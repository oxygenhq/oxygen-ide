/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

var ox_log = function (msg) {
    if (window.ox_debug) {
        console.log(msg);
    }
};

var BrowserVersion = function () {
    // http://stackoverflow.com/a/9851769/217039
    this.isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
    this.isFirefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
    this.isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
    // At least Safari 3+: "[object HTMLElementConstructor]"
    this.isChrome = !!window.chrome && !this.isOpera;              // Chrome 1+
    this.isIE = /*@cc_on!@*/false || !!document.documentMode; // At least IE6
    this.isIE9Quirks = this.isIE && document.compatMode === 'BackCompat';
};
var browserVersion = new BrowserVersion();

/*
 * Returns the text in this element
 */
function getText(element) {
    var text = normalizeNewlines(element.textContent);
    text = normalizeSpaces(text);
    text = applyTextTransformation(element, text);
    return text.trim();
}

/*
 * Applies text-transformation style on the given text. This is needed for link locators since 
 * Selenium's By.LinkText locates elements by the exact text it displays.
 */
function applyTextTransformation(element, text) {
    var txtTransform = window.getComputedStyle(element, null).getPropertyValue('text-transform');
    var txtTransformLower = txtTransform.toLowerCase();
    if (txtTransformLower === 'uppercase') {
        text = text.toUpperCase();
    } else if (txtTransformLower === 'lowercase') {
        text = text.toLowerCase();
    } else if (txtTransformLower === 'capitalize') {
        // FIXME: doesn't work. https://github.com/SeleniumHQ/selenium/issues/884
        text = text.replace(/\b\w/g, function (m) { return m.toUpperCase(); });
    }
    return text;
}

/**
 * Convert all newlines to \n
 */
function normalizeNewlines(text) {
    return text.replace(/\r\n|\r/g, '\n');
}

/**
 * Replace multiple sequential spaces with a single space, and then convert &nbsp; to space.
 */
function normalizeSpaces(text) {
    // Replace multiple spaces with a single space
    // TODO - this shouldn't occur inside PRE elements
    text = text.replace(/\ +/g, ' ');

    // Replace &nbsp; with a space
    var nbspPattern = new RegExp(String.fromCharCode(160), 'g');
    if (browserVersion.isSafari) {
    return replaceAll(text, String.fromCharCode(160), ' ');
    } else {
    return text.replace(nbspPattern, ' ');
    }
}
