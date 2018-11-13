/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';

export const addTab = (key, title) => {
  return {
    type: ActionTypes.TABS_ADD,
    payload: { key, title },
  };
};

export const removeTab = (key) => {
  return {
    type: ActionTypes.TABS_REMOVE,
    payload: { key },
  };
};

export const renameTab = (oldKey, newKey, newTitle) => {
  return {
    type: ActionTypes.TABS_RENAME,
    payload: { key: oldKey, newKey, newTitle },
  };
};

export const setActiveTab = (key) => {
  return {
    type: ActionTypes.TABS_SET_ACTIVE,
    payload: { key },
  };
};

export const setTabTouched = (key, touched) => ({
  type: ActionTypes.TABS_SET_TOUCHED,
  payload: { key, value: touched },
});

export const changeTabOrder = (fromIndex, toIndex) => ({
  type: ActionTypes.TABS_CHANGE_ORDER,
  payload: { fromIndex, toIndex },
});
