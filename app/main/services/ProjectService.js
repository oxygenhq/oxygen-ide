/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import ServiceBase from './ServiceBase';
import { cliutil } from 'oxygen-cli';

// oxygen.conf.js commonly defines lifecycle hooks (hooks.beforeTest, etc.) as actual
// functions. Those can't cross the IPC boundary (WebContents.send uses structured
// clone, which rejects functions) — strip them, since the renderer only uses this
// config to display settings; hook execution happens separately, in the worker
// process that re-requires oxygen.conf.js directly.
function stripFunctions(value, seen = new WeakSet()) {
    if (typeof value === 'function') {
        return undefined;
    }
    if (!value || typeof value !== 'object' || seen.has(value)) {
        return value;
    }
    seen.add(value);
    if (Array.isArray(value)) {
        return value.map(item => stripFunctions(item, seen));
    }
    const result = {};
    for (const key of Object.keys(value)) {
        const stripped = stripFunctions(value[key], seen);
        if (stripped !== undefined) {
            result[key] = stripped;
        }
    }
    return result;
}

export default class ProjectService extends ServiceBase {
    constructor() {
        super();
    }

    async getProjectSettings(projectPath) {
        const target = cliutil.processTargetPath(projectPath);
        const argv = {};
        let config;
        try {
            config = await cliutil.getConfigurations(target, argv);
        } catch (e) {
            return e.message;
        }
        return config ? stripFunctions(config) : null;
    }
}
