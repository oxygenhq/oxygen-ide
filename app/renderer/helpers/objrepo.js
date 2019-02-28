/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

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
    const sortedKeys = Object.keys(repo).sort();

    for (let key of sortedKeys) {
        const elm = repo[key];
        const path = rootPath ? `${rootPath}.${key}` : `${key}`;
        if (typeof elm === 'string' || Array.isArray(elm)) {
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
                newRoot[key][locatorName] = "";
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
                newRoot[key] = "";
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

// obj - parentNode
export function createFolderInRepoRoot(repo, newObjName, obj){
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
                const newChildValue = createFolderInRepoRoot(value, newObjName, serchStringLast);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = value;
                newRoot[key][newObjName] = {};
            }
        } else {
            newRoot[key] = value;
        }
    }
    return newRoot;
}

// obj - parentNode
export function createObjectInRepoRoot(repo, newObjName, obj){
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
                const newChildValue = createObjectInRepoRoot(value, newObjName, serchStringLast);
                newRoot[key] = newChildValue;
            } else {
                newRoot[key] = value;
                newRoot[key][newObjName] = "";
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