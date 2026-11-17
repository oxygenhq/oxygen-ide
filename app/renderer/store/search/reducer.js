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

const OPTION_KEYS = [
    'query', 'replacement', 'matchCase', 'wholeWord', 'useRegex', 'include', 'exclude', 'folder', 'showReplace'
];

const EMPTY_RESULTS = {
    results: [],
    totalMatches: 0,
    totalFiles: 0,
    truncated: false,
    skippedFiles: 0
};

const defaultState = {
    visible: false,
    // changes every time the panel is requested, so the search field can be focused again
    focusToken: 0,
    showReplace: false,
    query: '',
    replacement: '',
    matchCase: false,
    wholeWord: false,
    useRegex: false,
    include: '',
    exclude: '',
    // folder to search in
    folder: null,
    isSearching: false,
    isReplacing: false,
    // true once a search has finished, to tell "no results" from "not searched yet"
    hasSearched: false,
    error: null,
    // message about the last replace operation
    notice: null,
    ...EMPTY_RESULTS
};

const countMatches = (files) => files.reduce((sum, file) => sum + file.matches.length, 0);

export default (state = defaultState, action) => {
    const payload = action.payload || {};

    switch (action.type) {
    case types.SEARCH_SHOW: {
        const { folder, showReplace } = payload;
        return {
            ...state,
            visible: true,
            focusToken: state.focusToken + 1,
            // the replace row is only opened by the command, never closed by it
            showReplace: showReplace || state.showReplace,
            folder: folder || state.folder,
            notice: null
        };
    }

    case types.SEARCH_HIDE:
        return { ...state, visible: false };

    case types.SEARCH_SET_OPTIONS: {
        const newState = { ...state };
        OPTION_KEYS.forEach((key) => {
            if (payload.options && payload.options.hasOwnProperty(key)) {
                newState[key] = payload.options[key];
            }
        });
        // anything the user changes makes the previous replace message outdated
        newState.notice = null;
        return newState;
    }

    case types.SEARCH_RUN:
        return { ...state, isSearching: true, error: null };

    case success(types.SEARCH_RUN): {
        const { result } = payload;
        return {
            ...state,
            isSearching: false,
            hasSearched: true,
            error: null,
            results: result.files,
            totalFiles: result.files.length,
            totalMatches: countMatches(result.files),
            truncated: !!result.truncated,
            skippedFiles: result.skippedFiles || 0
        };
    }

    case failure(types.SEARCH_RUN):
        return {
            ...state,
            ...EMPTY_RESULTS,
            isSearching: false,
            hasSearched: false,
            error: payload.error
        };

    case types.SEARCH_REPLACE:
        return { ...state, isReplacing: true, error: null };

    case success(types.SEARCH_REPLACE):
        return { ...state, isReplacing: false, notice: payload.summary || null };

    case failure(types.SEARCH_REPLACE):
        return { ...state, isReplacing: false, error: payload.error };

    case types.SEARCH_DISMISS_FILE: {
        const results = state.results.filter(file => file.path !== payload.path);
        return {
            ...state,
            results,
            totalFiles: results.length,
            totalMatches: countMatches(results)
        };
    }

    case 'RESET':
        return defaultState;

    default:
        return state;
    }
};
