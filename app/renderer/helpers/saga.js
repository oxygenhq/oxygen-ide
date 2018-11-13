/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { put, take } from 'redux-saga/effects';
import { success, failure, successOrFailure, actionCreator } from './redux';

export function* putAndTake(requestAction) {
    yield put(requestAction);
    const responseAction = yield take(successOrFailure(requestAction.type))
    return responseAction.payload || {};
    /*if (responseAction.type === failure(requestAction.type)) {
        yield put(actionCreator(failureType, { ...failureArgs, error: responseAction.payload.error }));
        return false;
    }
    else {
        return true;
    }*/
}
