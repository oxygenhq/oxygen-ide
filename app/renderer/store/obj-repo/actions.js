/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
import { success, failure } from '../../helpers/redux';

// setParent 
export const setParent = (parent = null) => ({
  type: ActionTypes.OR_SET_PARENT,
  payload: { parent }
});

// openFile
export const openFile = (path, force = false, repoRootCopy = null) => ({
  type: ActionTypes.OR_OPEN_FILE,
  payload: { path, force, repoRootCopy },
});

export const _openFile_Success = (path, name, tree, start, end, repoRoot) => ({
  type: success(ActionTypes.OR_OPEN_FILE),
  payload: { path, name, tree, start, end, repoRoot },
});

export const _openFile_Failure = (path, error) => ({
  type: failure(ActionTypes.OR_OPEN_FILE),
  payload: { path, error },
});

// setActive
export const setActive = (path) => ({
  type: ActionTypes.OR_SET_ACTIVE,
  payload: { path },
});

// closeActive
export const closeActive = () => ({
  type: ActionTypes.OR_CLOSE_ACTIVE,
  payload: {},
});

// clear
export const clearObjRepo = () => ({
  type: ActionTypes.OR_CLEAR,
  payload: {  },
});

// clearObjectRepositoryFile
export const clearObjectRepositoryFile = () => ({
  type: ActionTypes.OR_OBJECT_REPOSITORY_FILE,
  payload: {},
});
