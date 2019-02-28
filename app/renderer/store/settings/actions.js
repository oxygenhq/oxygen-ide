/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

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
