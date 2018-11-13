/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Based on:
 * Copyright 2005 Shinya Kasatani. Licensed under the Apache License, Version 2.0
 */

function LocatorBuilders(window) {
    this.window = window;
}

LocatorBuilders.order = [];
LocatorBuilders.builderMap = {};

LocatorBuilders.prototype.finder = function() {
    var finder = this.window._locator_finder;
    if (!finder) {
        finder = new ElementFinder();
        var self = this;
        finder.getCurrentWindow = function() {
            return self.window;
        };
        this.window._locator_finder = finder;
    }
    return finder;
};

LocatorBuilders.prototype.buildWith = function(name, e, opt_contextNode) {
    return LocatorBuilders.builderMap[name].call(this, e, opt_contextNode);
};

LocatorBuilders.prototype.elementEquals = function(name, e, locator) {
    var fe = this.findElement(locator);
    //TODO: add match function to the ui locator builder, note the inverted parameters
    return (e == fe) || (LocatorBuilders.builderMap[name] && LocatorBuilders.builderMap[name].match && LocatorBuilders.builderMap[name].match(e, fe));
};

LocatorBuilders.prototype.build = function(e) {
    var locators = this.buildAll(e);
    if (locators.length > 0) {
        return locators[0][0];
    } else {
        return 'LOCATOR_DETECTION_FAILED';
    }
};

LocatorBuilders.prototype.buildAll = function(el) {
    var xpathLevel = 0;
    var maxLevel = 10;
    var locator;
    var locators = [];

    var coreLocatorStrategies = this.finder().locationStrategies;
    for (var i = 0; i < LocatorBuilders.order.length; i++) {
        var finderName = LocatorBuilders.order[i];
        try {
            locator = this.buildWith(finderName, el);
            if (locator) {
                locator = String(locator);
                //TODO: the builderName should NOT be used as a strategy name, create a feature to allow locatorBuilders to specify this kind of behaviour
                //TODO: Useful if a builder wants to capture a different element like a parent. Use the this.elementEquals
                var fe = this.findElement(locator);
                // if element has been removed from dom before we get here 
                // e.g. cookies notification divs which close once you click a button
                // and a CSS locator was used, then Sizzle won't be able to find element
                // and fe will be null. in such case just assume the CSS is correct.
                if (el == fe || fe === null) {
                    locator = locator.replace(/\r\n|\r|\n/g, '\\n');

                    // do not add css2 if it equals to css
                    var ignore = false;
                    if (finderName === 'css2') {
                        for (var loc = 0; loc < locators.length; loc++) {
                            if (locators[loc][0] === locator) {
                                ignore = true;
                                break;
                            }
                        }
                    }

                    if (!ignore) {
                        locators.push([ locator, finderName ]);
                    }
                }
            }
        } catch (e) {
            console.error('ox: locator exception: ' + e.message);
        }
    }
    return locators;
};

LocatorBuilders.prototype.findElement = function (locator, unique) {
    try {
        return this.finder().findElement(locator, null, unique);
    } catch (error) {
        return null;
    }
};

LocatorBuilders.add = function(name, finder) {
    this.order.push(name);
    this.builderMap[name] = finder;
};

/*
 * Utility function: Encode XPath attribute value.
 */
LocatorBuilders.prototype.attributeValue = function(value) {
    if (value.indexOf("'") < 0) {
        return "'" + value + "'";
    } else if (value.indexOf('"') < 0) {
        return '"' + value + '"';
    } else {
        var result = 'concat(';
        var part = '';
        while (true) {
            var apos = value.indexOf("'");
            var quot = value.indexOf('"');
            if (apos < 0) {
                result += "'" + value + "'";
                break;
            } else if (quot < 0) {
                result += '"' + value + '"';
                break;
            } else if (quot < apos) {
                part = value.substring(0, apos);
                result += "'" + part + "'";
                value = value.substring(part.length);
            } else {
                part = value.substring(0, quot);
                result += '"' + part + '"';
                value = value.substring(part.length);
            }
            result += ',';
        }
        result += ')';
        return result;
    }
};

LocatorBuilders.prototype.xpathHtmlElement = function(name) {
    if (this.window.document.contentType == 'application/xhtml+xml') {
        return 'x:' + name; // 'x:' prefix is required when testing XHTML pages
    } else {
        return name;
    }
};

LocatorBuilders.prototype.relativeXPathFromParent = function(current) {
    var index = this.getNodeNbr(current);
    var currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
    if (index > 0) {
        currentPath += '[' + (index + 1) + ']';
    }
    return currentPath;
};

LocatorBuilders.prototype.getNodeNbr = function(current) {
    var childNodes = current.parentNode.childNodes;
    var total = 0;
    var index = -1;
    for (var i = 0; i < childNodes.length; i++) {
        var child = childNodes[i];
        if (child.nodeName == current.nodeName) {
            if (child == current) {
                index = total;
            }
            total++;
        }
    }
    return index;
};

LocatorBuilders.prototype.getCSSSubPath = function(e) {
    var css_attributes = ['id', 'name', 'class', 'type', 'alt', 'title', 'value'];
    for (var i = 0; i < css_attributes.length; i++) {
        var attr = css_attributes[i];
        var value = e.getAttribute(attr);
        if (value) {
            value = value.trim();
            if (attr == 'id') {
                return '#' + value;
            }
            if (attr == 'class') {
                return e.nodeName.toLowerCase() + '.' + value.replace(/\s+/g, '.').replace('..', '.');
            }
            return e.nodeName.toLowerCase() + '[' + attr + '="' + value + '"]';
        }
    }
    if (this.getNodeNbr(e)) {
        return e.nodeName.toLowerCase() + ':nth-of-type(' + this.getNodeNbr(e) + ')';
    } else {
        return e.nodeName.toLowerCase();
    }
};

LocatorBuilders.prototype.preciseXPath = function(xpath, e){
    // only create more precise xpath if needed
    if (this.findElement(xpath, true) != e) {
        var result = e.ownerDocument.evaluate(xpath, e.ownerDocument, null, 7, null);
        //skip first element (result:0 xpath index:1)
        for (var i=0, len = result.snapshotLength; i < len; i++) {
            var newPath = '(' + xpath + ')[' + (i +1 )+']';
            if (this.findElement(newPath) == e) {
                return newPath;
            }
        }
    }
    return xpath;
};

/* ===== builders ===== */

LocatorBuilders.add('id', function(e) {
    if (e.id && this.findElement('id=' + e.id, true)) {
        return 'id=' + e.id;
    }
    return null;
});

LocatorBuilders.add('link', function(e) {
    if (e.nodeName == 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            text = applyTextTransformation(e, text);
            var loc = 'link=' + text.replace(/\xA0/g, ' ').replace(/^\s*(.*?)\s*$/, '$1');
            return this.findElement(loc, true) ? loc : null;
        }
    }
    return null;
});

LocatorBuilders.add('name', function(e) {
    if (e.name && this.findElement('name=' + e.name, true)) {
        return 'name=' + e.name;
    }
    return null;
});

LocatorBuilders.add('xpath:link', function(e) {
    if (e.nodeName == 'A') {
        var text = e.textContent;
        if (!text.match(/^\s*$/)) {
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('a') + "[contains(text(),'" + text.replace(/^\s+/, '').replace(/\s+$/, '') + "')]", e);
            return this.findElement(xp, true) ? xp : null;
        }
    }
    return null;
});

LocatorBuilders.add('xpath:img', function(e) {
    if (e.nodeName == 'IMG') {
        if (e.alt !== '') {
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('img') + '[@alt=' + this.attributeValue(e.alt) + ']', e);
            return this.findElement(xp, true) ? xp : null;
        } else if (e.title !== '') {
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('img') + '[@title=' + this.attributeValue(e.title) + ']', e);
            return this.findElement(xp, true) ? xp : null;
        } else if (e.src !== '') {
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('img') + '[contains(@src,' + this.attributeValue(e.src) + ')]', e);
            return this.findElement(xp, true) ? xp : null;
        }
    }
    return null;
});

LocatorBuilders.add('xpath:attributes', function(e) {
    // if we are trying to locate a frame element then the process is slightly different
    var frame = e.nodeName.toLowerCase() === 'frame' || e.nodeName.toLowerCase() === 'iframe';

    var PREFERRED_ATTRIBUTES = frame ?  ['id', 'src'] : ['id', 'name', 'value', 'type', 'action', 'onclick'];
    var i = 0;

    function attributesXPath(name, attNames, attributes) {
        var locator = '//' + this.xpathHtmlElement(name) + '[';
        for (i = 0; i < attNames.length; i++) {
            if (i > 0) {
                locator += ' and ';
            }
            var attName = attNames[i];
            if (frame) {
                locator += 'contains(@' + attName + ',' + this.attributeValue(attributes[attName]) + ')';
            } else {
                locator += '@' + attName + '=' + this.attributeValue(attributes[attName]);
            }
        }
        locator += ']';
        return this.preciseXPath(locator, e);
    }

    if (e.attributes) {
        var atts = e.attributes;
        var attsMap = {};
        for (i = 0; i < atts.length; i++) {
            var att = atts[i];
            attsMap[att.name] = att.value;
        }
        var names = [];
        // try preferred attributes
        for (i = 0; i < PREFERRED_ATTRIBUTES.length; i++) {
            var name = PREFERRED_ATTRIBUTES[i];
            if (attsMap[name]) {
                names.push(name);
                var locator = attributesXPath.call(this, e.nodeName.toLowerCase(), names, attsMap);
                if (!frame && e == this.findElement(locator)) {
                    if (!this.findElement(locator, true)) {
                        continue;
                    }
                    return locator;
                }
            }
        }
    }
    return null;
});

LocatorBuilders.add('xpath:idRelative', function(e) {
    var path = '';
    var current = e;
    while (current) {
        if (current.parentNode) {
            path = this.relativeXPathFromParent(current) + path;
            var parent = current.parentNode;
            if (1 /*ELEMENT_NODE*/ == parent.nodeType && parent.getAttribute('id')) {
                var xp = this.preciseXPath('//' + this.xpathHtmlElement(parent.nodeName.toLowerCase()) +
                        '[@id=' + this.attributeValue(parent.getAttribute('id')) + ']' +
                        path, e);
                return this.findElement(xp, true) ? xp : null;
            }
        } else {
            return null;
        }
        current = current.parentNode;
    }
    return null;
});

LocatorBuilders.add('xpath:href', function(e) {
    if (e.attributes && e.getAttribute('href') !== null) {
        href = e.getAttribute('href');
        if (href.search(/^http?:\/\//) >= 0) {
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('a') + '[@href=' + this.attributeValue(href) + ']', e);
            return this.findElement(xp, true) ? xp : null;
        } else {
            // use contains(), because in IE getAttribute('href') will return absolute path
            var xp = this.preciseXPath('//' + this.xpathHtmlElement('a') + '[contains(@href, ' + this.attributeValue(href) + ')]',e);
            return this.findElement(xp, true) ? xp : null;
        }
    }
    return null;
});

LocatorBuilders.add('xpath:position', function(e, opt_contextNode) {
    // if we are trying to locate a frame element then the process is slightly different
    var frame = e.nodeName.toLowerCase() === 'frame' || e.nodeName.toLowerCase() === 'iframe';

    var path = '';
    var current = e;
    while (current && current != opt_contextNode) {
        var currentPath;
        if (current.parentNode) {
            currentPath = this.relativeXPathFromParent(current);
        } else {
            currentPath = '/' + this.xpathHtmlElement(current.nodeName.toLowerCase());
        }

        if (frame) {
            if (currentPath === '/html') {
                return '/' + path;
            }
            path = currentPath + path; 
        } else {
            path = currentPath + path;
            var locator = '/' + path;
            if (e == this.findElement(locator, true)) {
                return locator;
            }
        }

        current = current.parentNode;
    }
    return null;
});

LocatorBuilders.add('css', function(e) {
    var current = e;
    var sub_path = this.getCSSSubPath(e);
    while (this.findElement('css=' + sub_path) != e && current.nodeName.toLowerCase() != 'html') {
        // for situations when element was removed from dom after interacting with it
        if (current.parentNode == null) {
            break;
        }
        sub_path = this.getCSSSubPath(current.parentNode) + ' > ' + sub_path;
        current = current.parentNode;
    }
    return this.findElement('css=' + sub_path, true) ? 'css=' + sub_path : null;
});

LocatorBuilders.add('css2', function(e) {
    try {
        var loc = 'css=' + cssFinder(e);
        return this.findElement(loc, true) ? loc : null;
    } catch (e) {   // might fail during frame locator generation
        return null;
    }
});
