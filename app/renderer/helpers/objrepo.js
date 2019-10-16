/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { notification } from 'antd';

export function findObject(repo, path) {
    if (!path) {
        return null;
    }
    if (!repo || !Array.isArray(repo)) {
        return null;
    }
    for (let obj of repo) {
        // exact match
        if (obj.path === path) {
            return obj;
        }
        // matching parent path -> continue searching among obj's children
        else if (path.startsWith(`${obj.path}.`) && Array.isArray(obj.children) && obj.children.length > 0) {
            return findObject(obj.children, path);
        }
    }
    return null;
}

export function convertToObjectTree(repo, rootPath = '') {    
    if (!repo || Object.keys(repo).length == 0) {
        return [];
    }
    const root = [];
    const keys = Object.keys(repo);

    for (let key of keys) {
        const elm = repo[key];
        const path = rootPath ? `${rootPath}.${key}` : `${key}`;

        if (Array.isArray(elm)) {
            root.push({
                name: key,
                path: path,
                type: 'object',
                locator: elm
            });
        }
        else if (typeof elm === 'object') {
            root.push({
                name: key,
                path: path,
                type: 'container',
                children: convertToObjectTree(elm, path),
            });
        } else {
            throw new Error('Object Repository is not valid');
        }
    }
    return root;
}

export function getRepositoryNameFromFileName(fileName) {
    if (!fileName || typeof fileName !== 'string' || fileName.length == 0) {
        return null;
    }
    // remove '.repo.js' or '.repo.json' from file name and use the remaining as repository name
    if (fileName.endsWith('.repo.js')) {
        return fileName.substr(0, fileName.lastIndexOf('.repo.js'));
    }
    else if (fileName.endsWith('.repo.json')) {
        return fileName.substr(0, fileName.lastIndexOf('.repo.json'));
    }
    // if no standard suffix of repository file was found, return repository name AS IS
    return fileName;    
}

export function addLocatorInRepoRoot(repo, parentPath, locatorName){
    if (!repo && !parentPath && !locatorName) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = addLocatorInRepoRoot(value, serchStringLast, locatorName);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = value;
                newRoot[key][locatorName] = [];
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

export function addArrayObjectLocatorInRepoRoot(repo, parentPath, locatorName){
    if (!repo && !parentPath && !locatorName) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = addArrayObjectLocatorInRepoRoot(value, serchStringLast, locatorName);
                newRoot[key] = newChildValue;
            } else {
                let newValue;

                if(value && Array.isArray(value)){
                    newValue = [...value, locatorName];
                } else {
                    newValue = [locatorName];
                }
                newRoot[key] = newValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

export function deleteObjectOrFolder(repo, parentPath, name){
    if (!repo && !parentPath && !name) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = obj.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = parentPath;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = deleteObjectOrFolder(value, serchStringLast, name);
                newRoot[key] = newChildValue;
            } else {
                let tmpValue = value;
                delete tmpValue[name];
                newRoot[key] = tmpValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}


export function deleteArrayObjectLocator(repo, parentPath, idx){

    if (!repo && !parentPath && typeof idx === 'undefined') {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = deleteArrayObjectLocator(value, serchStringLast, idx);
                newRoot[key] = newChildValue;
            } else {
                let newValue;

                if(value && Array.isArray(value)){
                    newValue = [...value];
                } else {
                    newValue = [];
                }

                if(newValue[idx]){
                    newValue.splice(idx, 1);
                } else {
                    console.warn('in newValue no element with idx', newValue, idx);
                }

                newRoot[key] = newValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

// obj - node where need to delete
export function deleteLocatorInRepoRoot(repo, obj){
    if (!repo && !newObjName && !parentNode) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(obj)){
        pathToObject = obj.join(".");
    } else if(typeof obj === "object"){
        const { path } = obj;
        pathToObject = path;
    } else if (typeof obj === "string") {
        pathToObject = obj;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = deleteLocatorInRepoRoot(value, serchStringLast);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = [];
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

export function renameLocatorInRepoRoot(repo, parentPath, newName, originName){
    if (!repo && !parentPath && !newName && !originName) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = renameLocatorInRepoRoot(value, serchStringLast, newName, originName);
                newRoot[key] = newChildValue;
            } else {
                let tmpValue = value;
                tmpValue[newName] = tmpValue[originName];
                delete tmpValue[originName];
                newRoot[key] = tmpValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

function arrayMove(arr, fromIndex, toIndex) {
    var element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);

    return arr;
}

function orderKey(obj, keyOrder) {
    const result = {}
    keyOrder.forEach((k) => {
      result[k] = obj[k]
    })
    return result;
  }

export function moveLocatorInRepoRoot(repo, parentPath, name, direction, index){
    if (!repo && !parentPath && !name && !direction) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = moveLocatorInRepoRoot(value, serchStringLast, name, direction, index);
                newRoot[key] = newChildValue;
            } else {

                const keys = Object.keys(value);
                
                if(direction === 'up'){

                    const indexByValue = keys.indexOf(name);
                    
                    const newKeysOrder = arrayMove(keys, indexByValue, indexByValue-1);
                    
                    let newValue = orderKey(value,newKeysOrder);

                    newRoot[key] = newValue;
                }

                if(direction === 'down'){

                    const indexByValue = keys.indexOf(name);
                    
                    const newKeysOrder = arrayMove(keys, indexByValue, indexByValue+1);
                    
                    let newValue = orderKey(value,newKeysOrder);

                    
                    newRoot[key] = newValue;

                }
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

function array_move(arr, old_index, new_index) {
    if (new_index >= arr.length) {
        var k = new_index - arr.length + 1;
        while (k--) {
            arr.push(undefined);
        }
    }
    arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
    return arr; // for testing
};

export function moveArrayObjectLocatorInRepoRoot(repo, parentPath, index, direction){
    if (!repo && !parentPath && !name && !direction) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }
    
    for (let [key, value] of Object.entries(repo)) {

        if(serchString === key){
            if(serchStringLast){
                const newChildValue = moveArrayObjectLocatorInRepoRoot(value, serchStringLast, name, direction, index);
                newRoot[key] = newChildValue;
            } else {

                const keys = Object.keys(value);
                
                // value = ['a', 'b', 'c', 'd']
                // keys = ['1', '2', '3', '4']

                if(direction === 'up'){
                    const newIndex = index - 1;
                    const newValue = array_move(value, index, newIndex);
                    newRoot[key] = newValue;
                }

                if(direction === 'down'){
                    const newIndex = index + 1;
                    const newValue = array_move(value, index, newIndex);
                    newRoot[key] = newValue;
                }
            }
        } else {
            newRoot[key] = value;
        }
    }

    return newRoot;
}

export function updateLocatorValueInRepoRoot(repo, locatorPath, locatorNewValue){
    if (!repo && !locatorPath && !locatorNewValue) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(locatorPath)){
        pathToObject = locatorPath.join(".");
    } else if(typeof locatorPath === "object"){
        const { path } = locatorPath;
        pathToObject = path;
    } else if (typeof locatorPath === "string") {
        pathToObject = locatorPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = updateLocatorValueInRepoRoot(value, serchStringLast, locatorNewValue);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = locatorNewValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

export function updateArrayObjecLocatorValueInRepoRoot(repo, parentPath, locatorNewValue, idx){

    if (!repo && !parentPath && typeof idx === 'undefined') {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = updateArrayObjecLocatorValueInRepoRoot(value, serchStringLast,locatorNewValue, idx);
                newRoot[key] = newChildValue;
            } else {
                let newValue;

                if(value && Array.isArray(value)){
                    newValue = [...value];
                } else {
                    newValue = [];
                }

                if(newValue[idx]){
                    newValue[idx] = locatorNewValue;
                } else {
                    console.warn('in newValue no element with idx', newValue, idx);
                }

                newRoot[key] = newValue;
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

// obj - parentNode
export function createContainerInRepoRoot(repo, newObjName, obj){
    if (!repo && !newObjName && !parentNode) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(obj)){
        pathToObject = obj.join(".");
    } else if(typeof obj === "object"){
        const { path } = obj;
        pathToObject = path;
    } else if (typeof obj === "string") {
        pathToObject = obj;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = createContainerInRepoRoot(value, newObjName, serchStringLast);
                newRoot[key] = newChildValue;
            } else {

                newRoot[key] = value;
                
                if(newRoot && key && newRoot[key] && newRoot[key][newObjName]){
                    notification['error']({
                        message: 'Tree item with this name already exist',
                        description: newObjName,
                    });
                } else {
                    newRoot[key][newObjName] = {};
                }
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

// obj - parentNode
export function createElementInRepoRoot(repo, newObjName, obj){
    if (!repo && !newObjName && !parentNode) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(obj)){
        pathToObject = obj.join(".");
    } else if(typeof obj === "object"){
        const { path } = obj;
        pathToObject = path;
    } else if (typeof obj === "string") {
        pathToObject = obj;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = createElementInRepoRoot(value, newObjName, serchStringLast);
                newRoot[key] = newChildValue;
            } else {

                newRoot[key] = value;

                if(newRoot && key && newRoot[key] && newRoot[key][newObjName]){
                    notification['error']({
                        message: 'Tree item with this name already exist',
                        description: newObjName,
                    });
                } else {
                    newRoot[key][newObjName] = [];
                }
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

const renameProp = (
    oldProp,
    newProp,
{ [oldProp]: old, ...others }
) => ({
    [newProp]: old,
    ...others
})

export function renameElementOrContaimerInRepoRoot(repo, parentPath, type, newName){

    if (!repo && !type && !parentPath && !newName) {
        return null;
    }

    let newRoot = {};
    let pathToObject;

    

    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.');
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = renameElementOrContaimerInRepoRoot(value, serchStringLast, type, newName);
                newRoot[key] = newChildValue;
            } else {
                if(repo && repo[newName]){
                    notification['error']({
                        message: 'Tree item with this name already exist',
                        description: newName,
                    });
                    
                    newRoot[key] = value;
                } else {
                    const renameResult = renameProp(key, newName, repo);
                    newRoot = renameResult;
                }

            }
        } else {
            newRoot[key] = value;
        }
    }

    
    return newRoot;
}

export function removeElementOrContaimerInRepoRoot(repo, parentPath, type){

    if (!repo && !type && !parentPath) {
        return null;
    }

    let newRoot = {};
    let pathToObject;

    

    if(Array.isArray(parentPath)){
        pathToObject = parentPath.join(".");
    } else if(typeof parentPath === "object"){
        const { path } = parentPath;
        pathToObject = path;
    } else if (typeof parentPath === "string") {
        pathToObject = parentPath;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.');
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = removeElementOrContaimerInRepoRoot(value, serchStringLast, type);
                newRoot[key] = newChildValue;
            } else {
                // just ignore
            }
        } else {
            newRoot[key] = value;
        }
    }
    
    return newRoot;
}

export function copyObjectInRepoRoot(repo, obj){
    if (!obj && !repo) {
        return null;
    }

    let newRoot = {};
    let pathToObject;
    
    if(Array.isArray(obj)){
        pathToObject = obj.join(".");
    } else if(typeof obj === "object"){
        const { path } = obj;
        pathToObject = path;
    } else if (typeof obj === "string") {
        pathToObject = obj;
    } else {
        console.warn('unespected typeof');
    }
    
    let serchString = '';
    let serchStringLast = '';
    
    if(pathToObject.includes('.')){
        const [ first, ...last ] = pathToObject.split('.')
        serchString = first;
        serchStringLast = last.join('.');

    } else {
        serchString = pathToObject;
    }

    for (let [key, value] of Object.entries(repo)) {
        if(serchString === key){
            if(serchStringLast){
                const newChildValue = copyObjectInRepoRoot(value, serchStringLast);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = repo[serchString];
                newRoot[key+'-copy'] = repo[serchString];
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}