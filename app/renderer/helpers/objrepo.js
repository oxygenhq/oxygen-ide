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