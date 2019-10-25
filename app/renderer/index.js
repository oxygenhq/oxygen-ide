/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import loggerSetup from './helpers/logger';
loggerSetup();

import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'antd/dist/antd.css';

import App from './containers/App';
import { configureStore, history } from './store/configureStore';
import { configureServices } from './services';
import './helpers/';
import './app.global.scss';

// initialize Redux store
const store = configureStore();
window.dispatch = store.dispatch;

configureServices(store);

render(
    <AppContainer>
        <App store={store} history={history} />
    </AppContainer>,
    document.getElementById('root')
);

if (module.hot) {
    module.hot.accept('./containers/App.js', () => {
        const NextRoot = require('./containers/App'); // eslint-disable-line global-require
        render(
            <AppContainer>
                <NextRoot store={store} history={history} />
            </AppContainer>,
            document.getElementById('root')
        );
    });
}
