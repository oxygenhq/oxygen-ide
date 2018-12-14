/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/*
 * This file includes all action types from various containers and also defines globel action types that are shared among containers
 */
import * as FS_TYPES from './fs/types';
import * as TABS_TYPES from './tabs/types';
import * as WB_TYPES from './workbench/types';
import * as EDITOR_TYPES from './editor/types';
import * as TEST_TYPES from './test/types';
import * as LOG_TYPES from './logger/types';
import * as DIALOG_TYPES from './dialog/types';
import * as RECORDER_TYPES from './recorder/types';
import * as OR_TYPES from './obj-repo/types';

export default {
    ...FS_TYPES,
    ...TABS_TYPES,
    ...WB_TYPES,
    ...EDITOR_TYPES,
    ...TEST_TYPES,
    ...LOG_TYPES,
    ...DIALOG_TYPES,
    ...RECORDER_TYPES,
    ...OR_TYPES,
};


