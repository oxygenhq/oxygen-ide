/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import path from 'path';

export function normalize(_path) {
    let normPath = path.normalize(_path);
    if (!normPath.endsWith(path.sep)) {
        return `${normPath}${path.sep}`;
    }
    return normPath;
}


export function updateFilesAfterRename(files, oldPath, renamedFile) {
    if (!files || files.length == 0 || !renamedFile) {
        return files;
    }
    const newPath = renamedFile.path;
    let newFileList = [];
    // normalize both old and new paths (make sure we add '/')
    let oldPathNorm = normalize(oldPath);

    for (var fPath of Object.keys(files)) {
        const file = files[fPath];
        // in case current folder was renamed
        if (file && file.path === oldPath) {
            newFileList[newPath] = {
                // preserve some of previous properties (such as 'content' and 'modified')
                ...file,
                // overwrite 'name' and 'path' properties with the updated information (after rename)
                ...renamedFile,
                children: file.children ? replaceChildrenPath(file.children, file.path, newPath) : null,
            };
        }
        // in case parent folder was renamed
        else if (file && file.path.startsWith(oldPathNorm)) {
            const adjustedPath = replacePath(file.path, oldPath, newPath);
            newFileList[adjustedPath] = {
                ...file,
                parentPath: replacePath(file.parentPath, oldPath, newPath),
                children: file.children ? replaceChildrenPath(file.children, file.path, newPath) : null,
            };
        }
        // in case current file/folder is not impacted by path chance (rename)
        else if (file && file.path){
            newFileList[file.path] = file;
        }
    }
    return newFileList;
}

export function replaceChildrenPath(children, oldPath, newPath) {
    if (!children || children.length == 0) {
        return children;
    }
    let newChildren = [];
    for (var child of children) {
        newChildren.push({
            ...child,
            parentPath: replacePath(child.parentPath, oldPath, newPath),
            path: replacePath(child.path, oldPath, newPath),
        });
    }
    return newChildren;
}

export function replacePath(path, inputOldPath, inputNewPath) {
    let oldPath = inputOldPath;
    let newPath = inputNewPath;
    // normalize all paths
    oldPath = normalize(oldPath);
    newPath = normalize(newPath);

    if (!path) {
        return null;
    }
    else if (!path.startsWith(oldPath)) {
        return path;
    }
    const remainingPath = path.substring(oldPath.length);
    return newPath + remainingPath;
}
