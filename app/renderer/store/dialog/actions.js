/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

export const showDialog = (dialog, params) => ({
    type: types.DIALOG,
    payload: { dialog, visible: true, ...params },
});

export const hideDialog = (dialog) => ({
    type: types.DIALOG,
    payload: { dialog, visible: false },
});

export const setParamstoDialog = (dialog, params) => ({
    type: types.DIALOG,
    payload: { dialog, visible: false, ...params },
});

export const startDownloadChromeDriver = (chromeDriverVersion) => ({
    type: types.DIALOG_START_DOWNLOAD_CHROME_DRIVER,
    payload: { chromeDriverVersion },
});

export const showDownloadChromeDriverError = () => ({
    type: types.DIALOG_SHOW_DOWNLOADING_CHROME_DRIVER_FAILED,
    payload: {  },
});

export const startDownloadEdgeDriver = (edgeDriverVersion) => ({
    type: types.DIALOG_START_DOWNLOAD_EDGE_DRIVER,
    payload: { edgeDriverVersion },
});

export const storeEdgeBinaryPath = (path) => ({
    type: types.STORE_EDGE_BINARY_PATH,
    payload: { path },
});

export const showDownloadEdgeDriverError = () => ({
    type: types.DIALOG_SHOW_DOWNLOADING_EDGE_DRIVER_FAILED,
    payload: {  },
});
