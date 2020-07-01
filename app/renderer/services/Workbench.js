/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

export default class Workbench {
    constructor(store, action$) {
        this.store = store;
        this.action$ = action$;
    }
    bind(store, action$) {
        this.store = store;
        this.action$ = action$;
    }
    openFile(path) {
        /*
            1. If file alredy open in one of the tabs, then make this tab active
            2. Show loader in Tabs panel header
            3. Read file content from the disk
            4. Open new tab with title of file name
            5. Load new editor's component or active a singletone editor (call 'activate' method), pass file details and content
        */
    }
    openFolder(path) {
        this.store.dispatch({ type: 'FS_REQUEST' });
        //action$.ofType(ActionTypes.FS_OPEN_FOLDER_RSP)
        //.mapTo({ type: 'UPS' });
        /*
            1. Warn user if a test is currently running
            2. Close all open tabs
            3. Reset FS state
            4. Show loader in File Explorer panel
            5. Retrieve folder's content by provided path
            6. Show error if something went wrong
            7. Set root path in FS and load the tree in File Explorer 
        */
    }
    editFile(path) {
        /*
            1. Check if file with this path already opened in one of the tabs
            2. If file is already open, active the tab with this file and finish the flow
            3. Show loader in Tabs panel header
            4. Read file's content from the disk
            5. Open new tab with title of file name
            6. Load new editor's component or active a singletone editor (call 'activate' method), pass file details and content
        */
    }
}
