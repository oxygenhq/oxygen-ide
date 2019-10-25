/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export default function createActionToSubjectMiddleware(action$) {
    if (!action$) {
        throw new TypeError('action$ argument must be of Subject type');
    }
    return store => next => action => {
        // Downstream middleware gets the action first,
        // which includes their reducers, so state is
        // updated before epics receive the action
        const result = next(action);

        action$.next(action);

        return result;
    };
}
