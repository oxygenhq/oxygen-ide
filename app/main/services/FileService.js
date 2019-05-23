/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

/* eslint-disable class-methods-use-this */
import fs from 'fs';
import fsExtra from 'fs-extra';
import path from 'path';
import rimraf from 'rimraf';
import junk from 'junk';
import chokidar from 'chokidar';
import { webContents } from 'electron';
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

const getFileInfo = (filePath) => {
    // this function accepts either fs.Stats object or path as string
    const stats = fs.lstatSync(filePath);
    const type = stats.isDirectory() ? 'folder' : (stats.isFile() ? 'file' : 'other');
    const parentPath = path.dirname(filePath);
    return {
        name: path.basename(filePath),
        path: filePath,
        parentPath,
        type,
        ext: path.extname(filePath),
    };
};

const send = data => {
    const allWebContents = webContents.getAllWebContents();
    allWebContents.forEach((contents) => {
        contents.send('MAIN_SERVICE_EVENT', data);
    });
};

const processChange = (eventPath, folderPath, type) => {
    const filePart = eventPath.split(folderPath);
    // FIXME: handle properly case when eventPath === folderPath
    if (filePart && filePart[1]) {
        // anylize file location
        if (eventPath) {  
            //  file or folder was deleted or renamed
            //  dirUnlink or fileUnlink
            if (['dirUnlink', 'fileUnlink', 'fileChangeContent'].includes(type)) { 
                send({
                    service: 'FileService',
                    event: 'filesWatcher',
                    type: type,
                    path: eventPath
                });
            } else {
                //  file or folder was added
                // dirAdd or fileAdd
                const fileInfo = getFileInfo(eventPath);
                send({
                    service: 'FileService',
                    event: 'filesWatcher',
                    type: type,
                    data: fileInfo
                });
            }
        } else {
            console.warn(`bad eventPath: ${eventPath}`);
        }
    } else {
        console.warn(`Bad split result with eventPath: ${eventPath} and folderPath: ${folderPath}`);
    }
};

export default class FileService extends ServiceBase {
    watcherOn = false;
    folderPath = '';
    subFolders = [];

    addFolderToWatchers(folder){
        if(this.subFolders.includes(folder)){
            // ignore
        } else {
            this.subFolders.push(folder);
            this.createWatchOnFilesChannel(this.folderPath, this.subFolders);
        }
    }

    
    removeFolderToWatchers(folder){
        if(Array.isArray(this.subFolders)){
            this.subFolders = this.subFolders.filter((item) => {
                return !item.startsWith(folder);
            });
            this.createWatchOnFilesChannel(this.folderPath, this.subFolders);
        }
    }

    createWatchOnFilesChannel(folderPath, subFolders = null) {

        if(Array.isArray(subFolders)){
            if(this.chokidarWatcher && this.chokidarWatcher.close){
                this.chokidarWatcher.close();
                this.watcherOn = false;
            }
        }

        if (!this.watcherOn) {
            this.folderPath = folderPath;
            this.watcherOn = true;

            let saveWatchFolders;

            if(Array.isArray(subFolders)){
                saveWatchFolders = [folderPath, ...subFolders];
            } else {
                saveWatchFolders = folderPath;
            }
            this.chokidarWatcher = chokidar.watch(saveWatchFolders, {
                ignored: ['**/node_modules/**/*', '**/node_modules/**/**/*', '**/.git/**/*', '*.gz'],
                ignoreInitial: true,
                ignorePermissionErrors: true,
                followSymlinks: true,
                interval: 1000,
                binaryInterval: 1000,
                useFsEvents: false,
                usePolling: true,
                depth: 0
            }).on('all', (event, eventPath, third) => {
                if (event === 'add') {
                    // file add
                    processChange(eventPath, folderPath, 'fileAdd');
                } else if (event === 'unlink') {
                    // file unlink(part of rename or delete)
                    processChange(eventPath, folderPath, 'fileUnlink');
                } else if (event === 'addDir') {
                    // dir add
                    processChange(eventPath, folderPath, 'dirAdd');
                } else if (event === 'unlinkDir') {
                    // dir unlink(part of rename or delete)
                    processChange(eventPath, folderPath, 'dirUnlink');
                } else if (event === 'change') {
                    // change file content
                    processChange(eventPath, folderPath, 'fileChangeContent');
                }

                else {
                    // console.log('event', event);
                    // console.log('eventPath', eventPath);
                }
            });
        }
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
        if(!data){
            // sometimes readFileSync return empty data on not emty file :-?
            setTimeout(function() { 
                var data = fs.readFileSync(filePath, 'utf8');
                send({
                    service: 'FileService',
                    event: 'getFileContent',
                    content: data,
                    path: filePath
                });
            }, 100);
        } else {
            send({
                service: 'FileService',
                event: 'getFileContent',
                content: data,
                path: filePath
            });
        }
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

    move(oldPath, newPath){
        if (!oldPath || !newPath) {
            throw new Error('Invalid arguments.');
        }
        return new Promise((resolve, reject) => {
            // make sure file with the new name doesn't already exist before renaming the old one
            fs.access(oldPath, (error) => {
                if (error) {
                    console.warn('error', error);
                } else {
                    fsExtra.move(oldPath, newPath, error => {
                        if(error){
                            console.error('error',error)
                        } else {
                            //do nothing, file watcher will do all work
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
