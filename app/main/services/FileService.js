/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import fs from 'fs';
import path from 'path';
import rimraf from 'rimraf';
import junk from 'junk';

import ServiceBase from './ServiceBase';
import fileFolderSorter from '../helpers/fileFolderSorter';
import isUnixHiddenPath from '../helpers/isUnixHiddenPath';
import isWinHiddenPath from '../helpers/isWinHiddenPath';

const FS_ERRORS = {
    EACCES: 'Permission denied',
    EEXIST: 'File/directory already exists',
    ENOENT: 'No such file or directory',
    EPERM: 'Operation not permitted'
};

export default class FileService extends ServiceBase {
    constructor() {
        super();
    }
    getFolderContent(folderPath) {
        let stats = fs.lstatSync(folderPath);
        if (!stats.isDirectory()) {
            throw Error(`Path is pointing to a file instead of folder.`);
        }
        let fileNames = fs.readdirSync(folderPath);
        let children = fileNames
            .reduce((result, fileName) => {
                const filePath = path.join(folderPath, fileName);
                // ignore any file that cannot be accessed (either locked or lack of permissions)
                try {
                    stats = fs.lstatSync(filePath);
                }
                catch (e) {
                    return result;
                }
                if (stats.isSymbolicLink() || junk.is(filePath) 
                    || isUnixHiddenPath(fileName)
                    || isWinHiddenPath(fileName)) {
                    return result;
                }
                result.push(this.getFileInfo(filePath, stats));
                return result;
            }, [])
            .sort(fileFolderSorter);
        // return folder's details and its children
        return {
            ...this.getFileInfo(folderPath),
            children: children,
        };
    }

    getFileInfo(filePath, fsStats = null) {
        // this function accepts either fs.Stats object or path as string
        const stats = fsStats ? fsStats : fs.lstatSync(filePath);
        const type = stats.isDirectory() ? 'folder' : (stats.isFile() ? 'file' : 'other');
        const parentPath = path.dirname(filePath);
        return {
            name: path.basename(filePath),
            path: filePath,
            parentPath: parentPath,
            type: type,
            ext: path.extname(filePath),
        };
    }

    getFileContent(filePath) {
        var data = fs.readFileSync(filePath, 'utf8');
        return data;
    }

    renameFileOrFolder(orgPath, newName) {
        if (!orgPath || !newName) {
            throw new Error('Invalid arguments.');
        }
        let newPath = orgPath.split(path.sep);
        newPath.splice(newPath.length - 1, 1, newName);
        newPath = newPath.join(path.sep);
        // actual rename
        return new Promise((resolve, reject) => {
            // make sure file with the new name doesn't already exist before renaming the old one
            fs.access(newPath, (error) => {
                if (!error) {
                    reject(this._humanizeErrorCode({
                      code: 'EEXIST',
                      path: orgPath
                    }));
                } else {
                    fs.rename(orgPath, newPath, (error) => {
                        if (error) {
                            reject(this._humanizeErrorCode(error));
                        } else {
                            resolve(this.getFileInfo(newPath));
                        }
                    });
                }
            });
        });
    }

    deleteFileOrFolder(fsPath) {
        if (!fsPath) {
            throw new Error('Invalid arguments.');
        }
        return new Promise((resolve, reject) => {
            rimraf(fsPath, (error) => {
                if (error) {
                    reject(this._humanizeErrorCode(error));
                }
                else {
                    resolve();
                }
            });
        });
    }

    createFolder(parentPath, name) {
        const newFolderPath = path.join(parentPath, name);
        
        return new Promise((resolve, reject) => {
            fs.mkdir(newFolderPath, undefined, (error) => {
                if (error) {
                    reject(this._humanizeErrorCode(error));
                }
                else {
                    resolve(newFolderPath);
                }
            });
        });
    }

    createFile(parentPath, name) {
        const newFilePath = path.join(parentPath, name);
        // make sure we throw an error if file already exist (flag: 'wx')
        return this.saveFileContent(newFilePath, '', 'utf-8', 'wx');
    }

    saveFileContent(filePath, content, encoding = 'utf8', flag = 'w') {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, content, { encoding, flag }, (error) => {
                if (error) {
                    reject(this._humanizeErrorCode(error));
                }
                else {
                    resolve(filePath);
                }
            });
        });
    }

    // replace POSIX error code with a human readable string
    _humanizeErrorCode(err) {
        if (err.code && FS_ERRORS[err.code]) {
            err.code = FS_ERRORS[err.code];
        }
        return err;
    }
}
