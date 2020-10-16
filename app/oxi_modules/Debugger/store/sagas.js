/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, takeLatest } from 'redux-saga/effects';

/* Helpers */
// import { putAndTake } from '../../../renderer/helpers/saga';
// import { convertToObjectTree, getRepositoryNameFromFileName } from '../../../renderer/helpers/objrepo';

/* Types */
import ActionTypes from './types';

/* Services */
// import ServicesSingleton from '../../services';
// const services = ServicesSingleton();

/**
 * Object Repository Sagas
 */
export default function* root() {
    yield all([
        takeLatest(ActionTypes.DBG_STEP_START, stepStart),
        takeLatest(ActionTypes.DBG_STEP_START, stepEnd)
    ]);
}

export function* stepStart() {
}

export function* stepEnd() {
}