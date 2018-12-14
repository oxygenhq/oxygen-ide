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

const defaultState = {
  path: null,
  name: 'name',
  tree: null,
  active: null,
};

export default (state = defaultState, action) => {
  const payload = action.payload || {};
  const { tree, path, name } = payload;

  switch (action.type) {
    // OPEN_FILE_SUCCESS
    case success(ActionTypes.OR_OPEN_FILE):
      return {
        ...state,
        tree: tree,
        path: path,
        name: name,
      };

    // OPEN_FILE_SUCCESS
    case ActionTypes.OR_SET_ACTIVE:
      return {
        ...state,
        active: path,
      };

    default:
      return state;
  }
};
