/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { all, fork } from 'redux-saga/effects';

import workbench from './workbench/sagas';
import fs from './fs/sagas';
import editor from './editor/sagas';
import test from './test/sagas';
import recorder from './recorder/sagas';
import settings from './settings/sagas';

/**
 * rootSaga
 */
export default function* root() {
  yield all([
    fork(workbench),
    fork(fs),
    fork(editor),
    fork(test),
    fork(recorder),
    fork(settings),
  ]);
}
