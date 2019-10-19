/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

export const removeUntitled = () => ({
    type: types.REMOVE_UNTITLED,
});

export const setBaseRoot = (path) => ({
    type: types.BASE_ROOT_PATH,
    payload: path,
});

export const createEmptyFile = () => ({
    type: types.CREATE_NEW_FILE,
});

export const updateFileData = data => ({
    type: types.UPDATE_FILE_DATA,
    payload: data,
});

export const setTreeNodes = nodes => ({
    type: types.TREE_NODES_BUNDLE,
    payload: nodes,
});

export const addNodeToTabs = node => ({
    type: types.ADD_NODE_TO_TABS,
    payload: node,
});

export const excludeNodeFromTabs = node => ({
    type: types.EXCLUDE_NODE_FROM_TABS,
    payload: node,
});

export const setCurrentFile = file => ({
    type: types.SET_CURRENT_FILE,
    payload: file,
});

export const setNewTabsOrder = (tabs) => ({
    type: types.SET_NEW_TABS_ORDER,
    payload: tabs,
});

export const setTabs = (tabs) => ({
    type: types.SET_TABS,
    payload: tabs,
});

export const cleanTabs = () => ({
    type: types.CLEAR_TABS_BUNDLE,
});

export const invokeRefreshScroll = () => ({
    type: types.REFRESH_SCROLL,
});
