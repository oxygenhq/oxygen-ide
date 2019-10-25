/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow

import { forwardToRenderer, triggerAlias, replayActionMain } from 'electron-redux';

const rootReducer = combineReducers(reducers);

const store = createStore(
    todoApp,
    initialState, // optional
    applyMiddleware(
        triggerAlias, // optional, see below
        ...otherMiddleware,
        forwardToRenderer, // IMPORTANT! This goes last
    ),
);

replayActionMain(store);

import { combineReducers } from 'redux';
import { routerReducer as router } from 'react-router-redux';
import counter from './counter/reducer';
import tree from './tree/reducer';
import settings from './settings/reducer';
import editor from './editor/reducer';
import modals from './modals/reducer';
import toolbar from './toolbar/reducer';

const rootReducer = combineReducers({
    counter,
    router,
    tree,
    settings,
    editor,
    modals,
    toolbar,
});

export default rootReducer;
