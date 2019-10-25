/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';

const convertVariablesForTree = (variables, objectId = null) => {

  if (!variables) {
      return [];
  }

  let result = [];

  if(objectId && variables && variables.child && Array.isArray(variables.child) && variables.child.length > 0){
    variables.child.map(item => {
      if(
        item &&
        item.objectId &&
        item.objectId === objectId &&
        item.objectIdResponse &&
        item.objectIdResponse.result &&
        Array.isArray(item.objectIdResponse.result) &&
        item.objectIdResponse.result.length > 0
      ){
        item.objectIdResponse.result.map((variable) => {
          if(
            variable &&
            variable.name &&
            variable.value &&
            variable.value.type
          ){
            result.push({
              name: variable.name,
              type: variable.value.type,
              value: variable.value.value || null,
              id: variable.value.objectId || null,
              children: convertVariablesForTree(item, variable.value.objectId || null),
            });
          }
        })
      }
    })
  }
  
  if(variables && Array.isArray(variables) && variables.length > 0){
    variables.map(callFrame => {
      if(callFrame && Array.isArray(callFrame) && callFrame.length > 0){
        callFrame.map(scope => {
          if(scope && Array.isArray(scope) && scope.length > 0){
            scope.map(item => {
              if(
                item && 
                item.objectId && 
                item.objectIdResponse && 
                item.objectIdResponse.result && 
                Array.isArray(item.objectIdResponse.result) &&
                item.objectIdResponse.result.length > 0
              ){
                item.objectIdResponse.result.map((variable) => {
                  if(
                    variable &&
                    variable.name &&
                    variable.value &&
                    variable.value.type
                  ){
                    const element = {
                      name: variable.name,
                      type: variable.value.type,
                      value: variable.value.value || null,
                      id: variable.value.objectId || null,
                      children: convertVariablesForTree(item, variable.value.objectId || item.objectId || null),
                    }
                    result.push(element);
                  }
                })
              }
            })
          }
        });
      }
    });
  }

  return result;
}

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

export const onBreakpoint = (file, line, variables) => ({
  type: ActionTypes.TEST_EVENT_BREAKPOINT,
  payload: { file, line, variables: convertVariablesForTree(variables) },
});

export const onLineUpdate = (time, file, line, primary) => ({
    type: ActionTypes.TEST_EVENT_LINE_UPDATE,
    payload: { time, file, line, primary },
});

export const setTestTarget = (value) => ({
    type: ActionTypes.TEST_SET_TARGET,
    payload: { value },
});

export const setTestProvider = (value) => ({
    type: ActionTypes.TEST_SET_PROVIDER,
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

export const setMainFile = (value, title = null) => ({
    type: ActionTypes.TEST_SET_MAIN,
    payload: { value, title },
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

export const updateBreakpoints = (filePath, breakpoints, fileName) => ({
    type: ActionTypes.TEST_UPDATE_BREAKPOINTS,
    payload: { path: filePath, breakpoints, fileName },
});

export const removeBreakpoints = (path) => ({
    type: ActionTypes.TEST_REMOVE_BREAKPOINTS,
    payload: { path },
});

export const moveBreakpointsFromTmpFileToRealFile = (tmpFilePath, tmpfileName, realFilePath) => ({
    type: ActionTypes.TEST_MOVE_BREAKPOINTS_FROM_TMP_FILE_TO_REAL_FILE,
    payload: { tmpFilePath, tmpfileName, realFilePath },
});

export const updateRunSettings = (settings) => ({
    type: ActionTypes.TEST_UPDATE_RUN_SETTINGS,
    payload: { settings },
});


