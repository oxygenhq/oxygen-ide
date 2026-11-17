/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';
import { success, failure } from '../../helpers/redux';

/* show the search panel, optionally for a specific folder */
export const showSearch = ({ folder = null, showReplace = false } = {}) => ({
    type: types.SEARCH_SHOW,
    payload: { folder, showReplace }
});

export const hideSearch = () => ({
    type: types.SEARCH_HIDE
});

/* update any of: query, replacement, matchCase, wholeWord, useRegex, include, exclude, folder, showReplace */
export const setSearchOptions = (options) => ({
    type: types.SEARCH_SET_OPTIONS,
    payload: { options }
});

export const runSearch = () => ({
    type: types.SEARCH_RUN
});

export const _runSearch_Success = (result) => ({
    type: success(types.SEARCH_RUN),
    payload: { result }
});

export const _runSearch_Failure = (error) => ({
    type: failure(types.SEARCH_RUN),
    payload: { error }
});

/* replace in the specified files, or in all found files if paths are not specified */
export const replaceInFiles = (paths = null) => ({
    type: types.SEARCH_REPLACE,
    payload: { paths }
});

export const _replaceInFiles_Success = (summary) => ({
    type: success(types.SEARCH_REPLACE),
    payload: { summary }
});

export const _replaceInFiles_Failure = (error) => ({
    type: failure(types.SEARCH_REPLACE),
    payload: { error }
});

export const openSearchMatch = (path, line, column, length) => ({
    type: types.SEARCH_OPEN_MATCH,
    payload: { path, line, column, length }
});

export const dismissSearchFile = (path) => ({
    type: types.SEARCH_DISMISS_FILE,
    payload: { path }
});
