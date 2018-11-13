/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';

export const startTest = () => ({
  type: ActionTypes.TEST_START,
  payload: null,
});

export const stopTest = () => ({
  type: ActionTypes.TEST_STOP,
  payload: null,
});

export const continueTest = () => ({
  type: ActionTypes.TEST_CONTINUE,
  payload: null,
});

export const onTestEnded = () => ({
  type: ActionTypes.TEST_EVENT_ENDED,
  payload: null,
});

export const onBreakpoint = () => ({
  type: ActionTypes.TEST_EVENT_BREAKPOINT,
  payload: null,
});

export const setTestTarget = (value) => ({
  type: ActionTypes.TEST_SET_TARGET,
  payload: { value },
});

export const setTestMode = (value) => ({
  type: ActionTypes.TEST_SET_MODE,
  payload: { value },
});

export const setStepDelay = (value) => ({
  type: ActionTypes.TEST_SET_STEP_DELAY,
  payload: { value },
});

export const setMainFile = (value) => ({
  type: ActionTypes.TEST_SET_MAIN,
  payload: { value },
});

export const setSeleniumReady = (value) => ({
  type: ActionTypes.TEST_SET_SELENIUM_READY,
  payload: { value },
});

export const setSeleniumPort = (value) => ({
  type: ActionTypes.TEST_SET_SELENIUM_PORT,
  payload: { value },
});

export const addDevice = (device) => ({
  type: ActionTypes.TEST_ADD_DEVICE,
  payload: { device },
});

export const removeDevice = (device) => ({
  type: ActionTypes.TEST_REMOVE_DEVICE,
  payload: { device },
});

export const updateBreakpoints = (filePath, breakpoints) => ({
  type: ActionTypes.TEST_UPDATE_BREAKPOINTS,
  payload: { path: filePath, breakpoints },
});

export const updateRunSettings = (settings) => ({
  type: ActionTypes.TEST_UPDATE_RUN_SETTINGS,
  payload: { settings },
});


