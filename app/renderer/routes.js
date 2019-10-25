/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/* eslint flowtype-errors/show-errors: 0 */
import React from 'react';
import { Switch, Route } from 'react-router';
import App from './containers/App';
import UserPage from './containers/UserPage';
import IdeScreen from './containers/IdeScreen';

export default () => (
    <App>
        <Switch>
            <Route path="/user" component={UserPage} />
            <Route exact path="/" component={IdeScreen} />
        </Switch>
    </App>
);
