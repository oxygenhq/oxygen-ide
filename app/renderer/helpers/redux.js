/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export const SUCCESS_TYPE_SUFFIX = 'SUCCESS';
export const FAILURE_TYPE_SUFFIX = 'FAILURE';

export function success(actionType) { 
    return actionType ? `${actionType}_${SUCCESS_TYPE_SUFFIX}` : actionType;
}

export function failure(actionType) {
    return actionType ? `${actionType}_${FAILURE_TYPE_SUFFIX}` : actionType;
}

export function successOrFailure(actionType) {
    return [success(actionType), failure(actionType)];
}

export function actionCreator(type, payload) {
    return { type, payload };
}
