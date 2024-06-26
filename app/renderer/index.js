/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import loggerSetup from './helpers/logger';
loggerSetup();

import * as Sentry from '@sentry/electron';
import React from 'react';
import { render } from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import 'antd/dist/antd.css';
import App from './containers/App';
import importConfigureStore from './store/configureStore';
import { configureServices } from './services';
import './app.global.scss';
import packageJson from '../../package.json';

if (process.env.NODE_ENV === 'production') {
    try {
        Sentry.init({
            dsn: 'https://24eaf38a68394ad69198ece9985cabff@o4504315553185792.ingest.sentry.io/4504315816116224',
            release: packageJson.version
        });
        window.Sentry = Sentry;
    } catch (e) {
        console.warn('Cannot initialize CrashReporter and Sentry', e);
    }
}

const { configureStore, history } = importConfigureStore;

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
        const NextRoot = require('./containers/App');
        render(
            <AppContainer>
                <NextRoot store={store} history={history} />
            </AppContainer>,
            document.getElementById('root')
        );
    });
}
