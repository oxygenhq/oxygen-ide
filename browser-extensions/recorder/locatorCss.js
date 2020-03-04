// Taken from https://github.com/ChromeDevTools/devtools-frontend/blob/97611c9403b4eb056eba05eb508c0a81aacdf0a5/front_end/elements/DOMPath.js

// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

const cssFinder = function (node, optimized) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
    }

    const steps = [];
    let contextNode = node;

    while (contextNode) {
        const step = _cssPathStep(contextNode, !!optimized, contextNode === node);

        if (!step) {
            break;
        } // Error - bail out early.

        steps.push(step);

        if (step.optimized) {
            break;
        }

        contextNode = contextNode.parentNode;
    }

    steps.reverse();
    return steps.join(' > ');
};

const _cssPathStep = function (node, optimized, isTargetNode) {
    if (node.nodeType !== Node.ELEMENT_NODE) {
        return null;
    }

    const id = node.getAttribute('id');

    if (optimized) {
        if (id) {
            return new _ox_Step(idSelector(id), true);
        }

        const nodeNameLower = node.nodeName.toLowerCase();
        if (nodeNameLower === 'body' || nodeNameLower === 'head' || nodeNameLower === 'html') {
            return new _ox_Step(nodeNameInCorrectCase(node), true);
        }
    }

    const nodeName = nodeNameInCorrectCase(node);

    if (id) {
        return new _ox_Step(nodeName + idSelector(id), true);
    }

    const parent = node.parentNode;

    if (!parent || parent.nodeType === Node.DOCUMENT_NODE) {
        return new _ox_Step(nodeName, true);
    }

    function prefixedElementClassNames(node) {
        const classAttribute = node.getAttribute('class');

        if (!classAttribute) {
            return [];
        }

        return classAttribute.split(/\s+/g).filter(Boolean).map(function (name) {
            // The prefix is required to store "__proto__" in a object-based map.
            return '$' + name;
        });
    }

    function idSelector(id) {
        return '#' + CSS.escape(id);
    }

    const prefixedOwnClassNamesArray = prefixedElementClassNames(node);
    let needsClassNames = false;
    let needsNthChild = false;
    let ownIndex = -1;
    let elementIndex = -1;
    const siblings = parent.children;

    for (let i = 0; (ownIndex === -1 || !needsNthChild) && i < siblings.length; ++i) {
        const sibling = siblings[i];

        if (sibling.nodeType !== Node.ELEMENT_NODE) {
            continue;
        }

        elementIndex += 1;

        if (sibling === node) {
            ownIndex = elementIndex;
            continue;
        }

        if (needsNthChild) {
            continue;
        }

        if (nodeNameInCorrectCase(sibling) !== nodeName) {
            continue;
        }

        needsClassNames = true;
        const ownClassNames = new Set(prefixedOwnClassNamesArray);

        if (!ownClassNames.size) {
            needsNthChild = true;
            continue;
        }

        const siblingClassNamesArray = prefixedElementClassNames(sibling);

        for (let j = 0; j < siblingClassNamesArray.length; ++j) {
            const siblingClass = siblingClassNamesArray[j];

            if (!ownClassNames.has(siblingClass)) {
                continue;
            }

            ownClassNames.delete(siblingClass);

            if (!ownClassNames.size) {
                needsNthChild = true;
                break;
            }
        }
    }

    let result = nodeName;

    if (isTargetNode && nodeName.toLowerCase() === 'input' && node.getAttribute('type') && !node.getAttribute('id') && !node.getAttribute('class')) {
        result += '[type=' + CSS.escape(node.getAttribute('type')) + ']';
    }

    if (needsNthChild) {
        result += ':nth-child(' + (ownIndex + 1) + ')';
    } else if (needsClassNames) {
        for (const prefixedName of prefixedOwnClassNamesArray) {
            result += '.' + CSS.escape(prefixedName.slice(1));
        }
    }

    return new _ox_Step(result, false);
};

let _ox_Step = function () {
    function _ox_Step(value, optimized) {
        this.value = value;
        this.optimized = optimized || false;
    }

    var descriptor = {
        key: "toString",
        value: function toString() {
            return this.value;
        }
    };

    descriptor.enumerable = false;
    descriptor.configurable = true;
    descriptor.writable = true;
    Object.defineProperty(_ox_Step.prototype, descriptor.key, descriptor);
    return _ox_Step;
}();

function nodeNameInCorrectCase(node) {
    const shadowRootType = node.shadowRoot && node.shadowRoot.mode;
    if (shadowRootType) {
        return '#shadow-root (' + shadowRootType + ')';
    }

    // If there is no local name, it's case sensitive
    if (!node.localName) {
        return node.nodeName;
    }

    // If the names are different lengths, there is a prefix and it's case sensitive
    if (node.localName.length !== node.nodeName.length) {
        return node.nodeName;
    }

    // Return the localname, which will be case insensitive if its an html node
    return node.localName;
}
