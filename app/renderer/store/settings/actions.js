/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

/* Create User  */
export const createUser = (uuid) => {
    return {
        type: types.CREATE_USER,
        payload: { 
            uuid
        }
    };
};

/* First Open  */
export const firstOpen = () => {
    return {
        type: types.FIRST_OPEN,
        payload: null
    };
};



/* Change Cache Used  */
export const changeShowRecorderMessageValue = (value) => {
    return {
        type: types.SHOW_RECORDER_MESSAGE_VALUE,
        payload: { value },
    };
};

/* Change Cache Used  */
export const changeCacheUsed = (value) => {
    return {
        type: types.CACHE_USED_CHANGE,
        payload: { value },
    };
};

/* Add file */
export const addFile = (key,name, content=null) => {
    console.log('!! addFile', key, name);
    return {
        type: types.TMP_ADD_FILE,
        payload: { key,name,content },
    };
};

/* Remove file */
export const removeFile = (key,name) => {
    return {
        type: types.TMP_REMOVE_FILE,
        payload: { key,name },
    };
};

/* updateFileContent */
export const updateFileContent = (path, content, name) => ({
    type: types.TMP_UPDATE_FILE_CONTENT,
    payload: { path, content, name },
});

/* show Landing */
export const showLanding = () => ({
    type: types.SHOW_LANDING
});

/* hide Landing */
export const hildeLanding = () => ({
    type: types.HIDE_LANDING
});

/* zoomIn */
export const zoomIn = () => ({
    type: types.EDITOR_ZOOM_IN
});

/* zoomOut */
export const zoomOut = () => ({
    type: types.EDITOR_ZOOM_OUT
});

/* zoomToDefault */
export const zoomToDefault = () => ({
    type: types.EDITOR_ZOOM_TO_DEFAULT
});

/* zoomToDefault */
export const setZoom = (zoom) => ({
    type: types.EDITOR_SET_ZOOM,
    payload: { zoom }
});

export const setSidebarVisible= (sidebar, visible) => ({
    type: types.SIDEBAR_SET_VISIBLE,
    payload: { target: sidebar, value: visible },
});

export const setSidebarSize = (sidebar, size) => ({
    type: types.SIDEBAR_SET_SIZE,
    payload: { target: sidebar, value: size },
});

export const setSidebarComponent = (sidebar, component) => ({
    type: types.SIDEBAR_SET_COMPONENT,
    payload: { target: sidebar, value: component },
});

export const setLoggerVisible= (visible) => ({
    type: types.LOGGER_SET_VISIBLE,
    payload: { value: visible },
});

export const mergeSettings = settings => ({
    type: types.SETTINGS_MERGE,
    payload: { settings },
});

export const setLastSessionRootFolder = value => ({
    type: types.LAST_SESSION_SET_ROOT_FOLDER,
    payload: { value },
});

export const updateVisualTestingSettings = visualProviders => ({
    type: types.UPDATE_VISUAL_PROVIDERS_SETTINGS,
    payload: { visualProviders }
});

export const updateCloudProvidersSettings = providers => ({
    type: types.UPDATE_CLOUD_PROVIDERS_SETTINGS,
    payload: { providers }
});

export const setCloudProvidersBrowsersAndDevices = (browsersAndDevices, testProvider) => ({
    type: types.SET_CLOUD_PROVIDERS_BROWSERS_AND_DEVICES,
    payload: { browsersAndDevices, testProvider },
});