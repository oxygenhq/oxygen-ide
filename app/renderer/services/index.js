/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import MainIpcService from './MainIpc';
import UserHintsService from './UserHints';

const services = {
    mainIpc: new MainIpcService(),
    userHints: new UserHintsService(),
};
export function configureServices(store, action$) {
    // bind all services to the store and action$ subject
    for (var name in services) {
        if (
            services &&
            services[name] &&
            services[name].bind
        ) {
            services[name].bind(store, action$ || null);
        }
    }

    global.services = services;

    return services;
}
export default () => services;
