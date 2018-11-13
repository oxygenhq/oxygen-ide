/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

export const setSidebarVisible= (sidebar, visible) => ({
  type: types.SIDEBAR_SET_VISIBLE,
  payload: { target: sidebar, value: visible },
});

export const setSidebarSize = (sidebar, size) => ({
  type: types.SIDEBAR_SET_SIZE,
  payload: { target: sidebar, value: size },
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
