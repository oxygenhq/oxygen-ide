/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';
import _ from 'lodash';
import fileFolderSorter from '../../main/helpers/fileFolderSorter';

export function checkEmpty(data) {
    if (data && data.length) {
        return data;
    }
    return null;
}

export function clearEmptyChildArray(element) {
    if (element && typeof element.children !== 'undefined') {
        if ((element.children && element.children.length === 0) || element.children === null) {
            delete element.children;
        }
    }
    return element;
}

export function clearDublicatesInChildArray(element) {
    if (element && element.children && element.children.length > 1) {
        return {
            ...element,
            children: _.uniqWith(element.children, _.isEqual)
        };
    }
    return element;
}

export function wrap(rawNodes) {
    if (!rawNodes || typeof rawNodes !== 'array') {
        return rawNodes;
    }
    return rawNodes.map(rawNode => ({
        ...rawNode,
        isTouched: false,
        isActive: false,
        isExpanded: false,
        children: null,
    }));
}

export function mergeChildren(prevChildren, nextChildren) {
    if (!prevChildren) {
        return nextChildren;
    } else if (!nextChildren) {
        return null;
    }
    let merged = [];
    for (let newChild of nextChildren) {
        // check if the node existed in previous children state
        const oldChild = prevChildren.find(x => x.path === newChild.path);
        if (oldChild != null) {
            merged.push(oldChild);
        }
        else {
            merged.push(newChild);
        }
    }
    return merged;
}

export function findTreeNode(root, nodePath) {
    if (!root || !root.length) {
        return null;
    }
    // make sure path ends with '/' (path separator)
    nodePath = nodePath.endsWith(path.sep) ? nodePath : nodePath + path.sep;
    for (let elm of root) {
        const elmPath = elm.path.endsWith(path.sep) ? elm.path : elm.path + path.sep;
        if (nodePath === elmPath) {
            return elm;
        }
        else if (nodePath !== elmPath && nodePath.startsWith(elmPath)) {
            return findTreeNode(elm.children, nodePath);
        }
    };
    return null;
}

export function addTreeNode(root, fsInfo, rootPath) {
    if (!root || !root.length) {
        return [fsInfo];
    }
    const { parentPath } = fsInfo;
    // make sure that node path ends with '/' (path separator)
    const safeRootPath = rootPath.endsWith(path.sep) ? rootPath : rootPath + path.sep;
    const safeNodePath = parentPath.endsWith(path.sep) ? parentPath : parentPath + path.sep;
    let newRoot = [];

    if (safeRootPath === safeNodePath) {
        newRoot = [...root];
        if (
            newRoot &&
            newRoot.length
        ) {
            newRoot.push(fsInfo);
            newRoot.sort(fileFolderSorter);
            newRoot = _.uniqWith(newRoot, _.isEqual);
        } else {
            newRoot = [fsInfo];
        }
    } else {
        root.forEach(elm => {
            const elmPath = elm.path.endsWith(path.sep) ? elm.path : elm.path + path.sep;
            if (safeNodePath.startsWith(elmPath)) {
                if (elmPath === safeNodePath) {
                    let childrenClone = [];
                    if (elm.children && elm.children.length) {
                        childrenClone = [...elm.children];
                    }
                    childrenClone.push(fsInfo);
                    childrenClone = [..._.uniqWith(childrenClone, _.isEqual)];
                    childrenClone.sort(fileFolderSorter);
                    newRoot.push(clearDublicatesInChildArray({
                        ...elm,
                        children: childrenClone
                    }));
                } else {
                    newRoot.push(clearDublicatesInChildArray({
                        ...elm,
                        children: elm.children ? addTreeNode(elm.children, fsInfo) : null,
                    }));
                }
            } else {
                newRoot.push(elm);
            }
        });
    }
    return newRoot;
}

export function removeTreeNode(root, nodePath) {
    if (!root || !root.length) {
        return null;
    }
    // make sure that node path ends with '/' (path separator)
    const safeNodePath = nodePath.endsWith(path.sep) ? nodePath : nodePath + path.sep;
    const newRoot = [];
    root.forEach(elm => {
        const elmPath = elm.path.endsWith(path.sep) ? elm.path : elm.path + path.sep;
        if (safeNodePath !== elmPath && safeNodePath.startsWith(elmPath)) {
            newRoot.push(clearEmptyChildArray({
                ...elm,
                children: elm.children ? removeTreeNode(elm.children, safeNodePath) : null,
            }));
        } else if (safeNodePath !== elmPath) {
            newRoot.push(elm);
        }
    });
    return newRoot;
}

export function updateTree(root, updatedNode, oldPath = null) {
    if (!root || !root.length) {
        return null;
    }
    // if oldPath is specified, this means that the node has been renamed and path has changed
    // in that case, the updatedNode will hold an updated file info with the new path
    let nodePath = oldPath ? oldPath : updatedNode.path;
    // make sure that node path ends with '/' (path separator)
    nodePath = nodePath.endsWith(path.sep) ? nodePath : nodePath + path.sep;
    //  return root;
    const retval = root.map(elm => {
        const elmPath = elm.path.endsWith(path.sep) ? elm.path : elm.path + path.sep;
        if (nodePath === elmPath) {
            return { ...updatedNode };
        } else if (nodePath.startsWith(elmPath)) {
            return {
                ...elm,
                children: elm.children ? updateTree(elm.children, updatedNode, oldPath) : null,
            };
        }
        return elm;
    });
    return retval;
}

export function updateExpandedKeys(expandedKeys, newKey) {
    if (!expandedKeys.includes(newKey)) {
        return [...expandedKeys, newKey];
    }
    return expandedKeys;
}

export function removeExpandedKey(expandedKeys, removeKey) {
    if (!removeKey || !removeKey.length || removeKey.length == 0) {
        return expandedKeys;
    }
    // add path separator to the end of the key
    let removeKeyWithSep = removeKey;
    if (removeKeyWithSep[removeKeyWithSep.length-1] !== path.sep) {
        removeKeyWithSep += path.sep;
    }
    
    return expandedKeys.filter(key => (key.indexOf(removeKeyWithSep) == -1 && key !== removeKey));
}
export function syncChildrenExpand(node) {
    if (!node.children || node.children.length ==0) {
        return;
    }
    node.children.forEach(child => {
        // go further only if node's child has different isExpanded value
        if (child.isExpanded != node.isExpanded) {
            child.isExpanded = node.isExpanded;
            syncChildrenExpand(child);
        }
    });
}
