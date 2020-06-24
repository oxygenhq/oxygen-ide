/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import ServiceBase from './ServiceBase';
import { Runners, ReportAggregator, util as oxutil, cliutil } from 'oxygen-cli';

export default class ProjectService extends ServiceBase {
    constructor() {
        super();
    }

    async getProjectSettings(projectPath) {
        const target = cliutil.processTargetPath(projectPath);
        const argv = {};
        const config = await cliutil.getConfigurations(target, argv);
        
        return config || null;
    }

}
