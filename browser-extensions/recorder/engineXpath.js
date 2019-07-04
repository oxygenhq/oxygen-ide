/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/*
 * Evaluates XPath expression against a document and returns matching element(s).
 */
function XPathEngine() {
}

XPathEngine.prototype.selectSingleNode = function(xpath, contextNode, namespaceResolver) {
    var nodes = this.selectNodes(xpath, contextNode, namespaceResolver);
    return (nodes && nodes.length > 0 ? nodes[0] : null);
};

XPathEngine.prototype.selectNodes = function(xpath, contextNode, namespaceResolver) {
    if (contextNode != this.doc) {
        // Regarding use of the second argument to document.evaluate():
        // http://groups.google.com/group/comp.lang.javascript/browse_thread/thread/a59ce20639c74ba1/a9d9f53e88e5ebb5
        xpath = '.' + xpath;
    }
    var nodes = [];
    var xpathResult;
    try {
        xpathResult = contextNode.evaluate(xpath, contextNode, namespaceResolver, 0, null);
    } catch (e) {
        console.error('ox: invalid xpath [1]: ' + (e.message || e));
        return null;
    }

    if (xpathResult === null) {
        console.error('ox: invalid xpath [2]: ' + xpath);
        return null;
    }
    
    var node = xpathResult.iterateNext();
    
    while (node) {
        nodes.push(node);
        node = xpathResult.iterateNext();
    }
    
    return nodes;
};

XPathEngine.prototype.setDocument = function(newDocument) {
    this.doc = newDocument;
};

XPathEngine.prototype.init = function() {
    this.doc = document;
};
