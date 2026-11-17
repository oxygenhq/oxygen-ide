/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, call, put, select, takeLatest } from 'redux-saga/effects';
import { notification } from 'antd';
import confirm from '../../helpers/confirm';
import { putAndTake } from '../../helpers/saga';
import * as types from './types';
import * as searchActions from './actions';
import * as wbActions from '../workbench/actions';
import * as fsActions from '../fs/actions';
import * as orActions from '../obj-repo/actions';
import editorSubjects from '../editor/subjects';
import ServicesSingleton from '../../services';

const services = ServicesSingleton();

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

const getSearchOptions = (search, rootPath) => ({
    folder: search.folder || rootPath,
    query: search.query,
    matchCase: search.matchCase,
    wholeWord: search.wholeWord,
    useRegex: search.useRegex,
    include: search.include,
    exclude: search.exclude
});

const getErrorMessage = (error) => {
    if (!error) {
        return 'Unknown error';
    }
    return error.message || error.code || String(error);
};

/**
 * Search Sagas
 */
export default function* root() {
    yield all([
        takeLatest(types.SEARCH_RUN, runSearch),
        takeLatest(types.SEARCH_REPLACE, replaceInFiles),
        takeLatest(types.SEARCH_OPEN_MATCH, openMatch),
    ]);
}

export function* runSearch() {
    const search = yield select(state => state.search);
    const rootPath = yield select(state => state.fs.rootPath);
    const options = getSearchOptions(search, rootPath);

    if (!options.folder) {
        yield put(searchActions._runSearch_Failure('Open a folder first.'));
        return;
    }
    if (!options.query) {
        // nothing to search for
        yield put(searchActions._runSearch_Success({ files: [] }));
        return;
    }

    try {
        const result = yield call(services.mainIpc.call, 'SearchService', 'findInFiles', [options]);
        // the search was replaced by a newer one in the main process
        if (!result || result.cancelled) {
            return;
        }
        yield put(searchActions._runSearch_Success(result));
    } catch (e) {
        yield put(searchActions._runSearch_Failure(getErrorMessage(e)));
    }
}

export function* replaceInFiles({ payload }) {
    const { paths } = payload;
    const search = yield select(state => state.search);
    const rootPath = yield select(state => state.fs.rootPath);
    const options = getSearchOptions(search, rootPath);

    const found = Array.isArray(paths)
        ? search.results.filter(file => paths.includes(file.path))
        : search.results;

    // files with unsaved changes in the editor are never replaced, the editor's content would not match the disk anymore
    const fsFiles = yield select(state => state.fs.files);
    const unsaved = found.filter(file => fsFiles[file.path] && fsFiles[file.path].modified);
    const targets = found.filter(file => !unsaved.includes(file));

    if (targets.length === 0) {
        if (unsaved.length > 0) {
            notification['warning']({
                message: 'Nothing was replaced',
                description: 'All the files have unsaved changes. Save the files and search again.'
            });
        }
        yield put(searchActions._replaceInFiles_Success(null));
        return;
    }

    const occurrences = targets.reduce((sum, file) => sum + file.matches.length, 0);
    const answer = yield call(confirm, {
        title: `Replace ${plural(occurrences, 'occurrence')} in ${plural(targets.length, 'file')}?`,
        content: unsaved.length > 0
            ? `This changes the files on disk and cannot be undone. ${plural(unsaved.length, 'file')} with unsaved changes will be skipped.`
            : 'This changes the files on disk and cannot be undone.',
        okText: 'Replace',
        cancelText: 'Cancel',
        okButtonProps: { danger: true }
    });
    if (!answer) {
        yield put(searchActions._replaceInFiles_Success(null));
        return;
    }

    try {
        const result = yield call(services.mainIpc.call, 'SearchService', 'replaceInFiles', [{
            ...options,
            replacement: search.replacement,
            files: targets.map(file => file.path)
        }]);

        const replacedPaths = result.replaced.map(item => item.path);
        let summary = `Replaced ${plural(result.totalReplacements, 'occurrence')} in ${plural(result.replaced.length, 'file')}.`;
        if (unsaved.length > 0) {
            summary += ` Skipped ${plural(unsaved.length, 'file')} with unsaved changes.`;
        }
        if (result.failed.length > 0) {
            const names = result.failed.map(item => `${item.path} (${item.error})`).join('\n');
            summary += ` ${plural(result.failed.length, 'file')} could not be changed.`;
            notification['error']({
                message: 'Some files could not be changed',
                description: names,
                duration: 0
            });
        }
        yield put(searchActions._replaceInFiles_Success(summary));

        yield call(refreshChangedFiles, replacedPaths);
        // show what is left
        yield put(searchActions.runSearch());
    } catch (e) {
        yield put(searchActions._replaceInFiles_Failure(getErrorMessage(e)));
    }
}

/**
 * Reloads files that have been changed on the disk by the replace operation, so the editor tabs show the new content
 */
function* refreshChangedFiles(paths) {
    const openFiles = yield select(state => state.editor.openFiles);
    const objRepoPath = yield select(state => state.objrepo && state.objrepo.path);

    for (const path of paths) {
        if (openFiles.hasOwnProperty(path)) {
            yield put(fsActions.fetchFileContent(path));
        }
        // the Object Repository panel keeps its own parsed copy of the file
        if (objRepoPath && objRepoPath === path) {
            yield put(orActions.openFile(path));
        }
    }
}

export function* openMatch({ payload }) {
    const { path, line, column, length } = payload;

    const { error } = yield putAndTake(wbActions.openFile(path));
    if (error) {
        return;
    }
    editorSubjects['EDITOR.REVEAL'].next({ path, line, column, length });
}
