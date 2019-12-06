/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import { combineReducers } from 'redux';
import tree from './tree/reducer';
import settings from './settings/reducer';
import editor from './editor/reducer';
import fs from './fs/reducer';
import tabs from './tabs/reducer';
import test from './test/reducer';
import logger from './logger/reducer';
import dialog from './dialog/reducer';
import wb from './workbench/reducer';
import recorder from './recorder/reducer';
import objrepo from './obj-repo/reducer';

const rootReducer = combineReducers({
    tree,
    settings,
    editor,
    fs,
    tabs,
    test,
    logger,
    dialog,
    wb,
    recorder,
    objrepo
});

export default rootReducer;
