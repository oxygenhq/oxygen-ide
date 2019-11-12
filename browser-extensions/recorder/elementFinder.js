/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Based on:
 * Copyright 2011 Software Freedom Conservancy. Licensed under the Apache License, Version 2.0
 */

var ElementFinder = function() {
    this.xpathEvaluator = new XPathEngine();
    this.xpathEvaluator.init();
    this._registerAllLocatorFunctions();
};

ElementFinder.prototype._registerAllLocatorFunctions = function() {
    // TODO - don't do this in the constructor - only needed once ever
    this.locationStrategies = {};
    for (var functionName in this) {
        var result = /^locateElementBy([A-Z].+)$/.exec(functionName);
        if (result !== null) {
            var locatorFunction = this[functionName];
            if (typeof(locatorFunction) != 'function') {
                continue;
            }
            // Use a specified prefix in preference to one generated from
            // the function name
            var locatorPrefix = locatorFunction.prefix || result[1].toLowerCase();
            this.locationStrategies[locatorPrefix] = locatorFunction;
        }
    }

    /**
     * Find a locator based on a prefix.
     */
    this.findElementBy = function(locatorType, locator, inDocument, inWindow, unique) {
        var locatorFunction = this.locationStrategies[locatorType];
        if (!locatorFunction) {
            ox_error("Unrecognised locator type: '" + locatorType + "'");
            return null;
        }
        return locatorFunction.call(this, locator, inDocument, inWindow, unique);
    };

    /**
     * The implicit locator, that is used when no prefix is supplied.
     */
    this.locationStrategies.implicit = function(locator, inDocument, inWindow) {
        if (locator.startsWith('//') || locator.startsWith('(')) {
            return this.locateElementByXPath(locator, inDocument, inWindow);
        }
        return null;
    };
};

/*
 * Finds an element recursively in frames and nested frames in the specified document, using various lookup protocols
 */
ElementFinder.prototype.findElementRecursive = function(locatorType, locatorString, inDocument, inWindow, unique) {
    var element = this.findElementBy(locatorType, locatorString, inDocument, inWindow, unique);
    if (element !== null) {
        return element;
    }

    for (var i = 0; i < inWindow.frames.length; i++) {
        // On some browsers, the document object is undefined for third-party frames.
        // Make sure the document is valid before continuing.
        if (inWindow.frames[i].document) {
            element = this.findElementRecursive(locatorType, locatorString, inWindow.frames[i].document, inWindow.frames[i], unique);
            if (element !== null) {
                return element;
            }
        }
    }
};

/*
* Finds an element on the specified page, using various lookup protocols
*/
ElementFinder.prototype.findElement = function(locator, win, unique) {
    var locatorParsed = parseLocator(locator);
    var element = this.findElementRecursive(locatorParsed.type, locatorParsed.string, win.document, win, unique);
    return element;
};

/**
 * Find the element with id
 */
ElementFinder.prototype.locateElementById = function(identifier, inDocument, inWindow, unique) {
    var element = inDocument.getElementById(identifier);
    if (element && element.getAttribute('id') === identifier) {
        // make sure the ID is unique (it should be as per HTML spec, but not always the case in the wild)
        var nodes = this.xpathEvaluator.selectNodes('//*[@id="' + identifier + '"]', inDocument,
            inDocument.createNSResolver ?
                inDocument.createNSResolver(inDocument.documentElement) : this._namespaceResolver);
        return nodes && nodes.length === 1 ? element : null;
    } else {
        return null;
    }
};

/**
 * Find an element by css selector
 */
ElementFinder.prototype.locateElementByCss = function (locator, inDocument, inWindow, unique) {
    if (!unique) {
        return inDocument.querySelector(locator);
    } else {
        var selectors = inDocument.querySelectorAll(locator);
        return selectors.length === 1 ? selectors[0] : null;
    }
};

/**
 * Finds a link element with text matching the expression supplied. Expressions must begin with "link:".
 */
ElementFinder.prototype.locateElementByLinkText = function(linkText, inDocument, inWindow, unique) {
    var links = inDocument.getElementsByTagName('a');
    var matches = 0;
    var match = null;
    for (var i = 0; i < links.length; i++) {
        var element = links[i];
        if (linkText == getText(element)) {
            matches++;
            match = element;
            if (!unique) {  // if uniqueness is not required just return first match
                return element;
            }
        }
    }
    return matches > 1 ? null : match;
};

ElementFinder.prototype.locateElementByLinkText.prefix = 'link';

/**
 * Find an element by name, refined by (optional) element-filter expressions.
 */
ElementFinder.prototype.locateElementByName = function(locator, inDocument, inWindow, unique) {
    var elements = inDocument.getElementsByTagName('*');

    var filters = locator.split(' ');
    filters[0] = 'name=' + filters[0];

    while (filters.length) {
        var filter = filters.shift();
        elements = this.selectElements(filter, elements, 'value');
    }

    if (!elements) {
        return null;
    }

    if (unique && elements.length === 1 ||
        !unique && elements.length > 0) {
        return elements[0];
    }
    return null;
};

/**
 * Finds an element identified by the xpath expression. Expressions _must_ begin with "//".
 */
ElementFinder.prototype.locateElementByXPath = function(xpath, inDocument, inWindow, unique) {
    var nodes = this.xpathEvaluator.selectNodes(xpath, inDocument,
        inDocument.createNSResolver ?
            inDocument.createNSResolver(inDocument.documentElement) : this._namespaceResolver);

    if (nodes && nodes.length === 1) {
        return nodes[0];
    }
    return null;
};

ElementFinder.prototype._namespaceResolver = function(prefix) {
    if (prefix == 'html' || prefix == 'xhtml' || prefix == 'x') {
        return 'http://www.w3.org/1999/xhtml';
    } else if (prefix == 'mathml') {
        return 'http://www.w3.org/1998/Math/MathML';
    } else if (prefix == 'svg') {
        return 'http://www.w3.org/2000/svg';
    } else {
        throw new Error('Unknown namespace: ' + prefix + '.');
    }
};

/**
 * Refine a list of elements using a filter.
 */
ElementFinder.prototype.selectElementsBy = function(filterType, filter, elements) {
    var filterFunction = ElementFinder.filterFunctions[filterType];
    if (!filterFunction) {
        return null;
    }

    return filterFunction(filter, elements);
};

ElementFinder.filterFunctions = {};

ElementFinder.filterFunctions.name = function(name, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].name === name) {
            selectedElements.push(elements[i]);
        }
    }
    return selectedElements;
};

ElementFinder.filterFunctions.value = function(value, elements) {
    var selectedElements = [];
    for (var i = 0; i < elements.length; i++) {
        if (elements[i].value === value) {
            selectedElements.push(elements[i]);
        }
    }
    return selectedElements;
};

ElementFinder.filterFunctions.index = function(index, elements) {
    index = Number(index);
    if (isNaN(index) || index < 0) {
        ox_error('illegal index: ' + index);
        return null;
    }
    if (elements.length <= index) {
        ox_error('index out of range: ' + index);
        return null;
    }
    return [elements[index]];
};

ElementFinder.prototype.selectElements = function(filterExpr, elements, defaultFilterType) {
    var filterType = (defaultFilterType || 'value');

    // If there is a filter prefix, use the specified strategy
    var result = filterExpr.match(/^([A-Za-z]+)=(.+)/);
    if (result) {
        filterType = result[1].toLowerCase();
        filterExpr = result[2];
    }

    return this.selectElementsBy(filterType, filterExpr, elements);
};

/**
 * Parses locator, returning its type and the unprefixed locator string as an object.
 */
function parseLocator(locator) {
    var result = locator.match(/^([A-Za-z]+)=.+/);
    if (result) {
        var type = result[1].toLowerCase();
        var actualLocator = locator.substring(type.length + 1);
        return { type: type, string: actualLocator };
    }
    return { type: 'implicit', string: locator };
}
