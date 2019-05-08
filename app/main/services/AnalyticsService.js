/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import Mixpanel from 'mixpanel';
import ServiceBase from "./ServiceBase";
import moment from 'moment';

export default class AnalyticsService extends ServiceBase {
    constructor() {
        super();
        this.uuid = null;
        this.mixpanel = Mixpanel.init('e80db0ad2789b5718fa1b84b6661f008');
    }

    async dispose() {
        await this.ideClose();
    }

    setUser(uuid){
        this.uuid = uuid;
        this.ideOpen();
    }

    createUser(uuid){
        this.uuid = uuid;
        this.mixpanel.people.set(uuid, {
            $created: (new Date()).toISOString(),
        });
        this.ideOpen();
    }

    ideOpen(){
        this.openMoment = moment();
        this.mixpanel.track('IDE_OPEN', {
            distinct_id: this.uuid
        });
    }

    ideClose(){
        return new Promise((resolve, reject) => {    
            const closeMoment = moment();
            const duration = closeMoment.diff(this.openMoment, 'seconds');
            
            this.mixpanel.track('IDE_CLOSE', {
                distinct_id: this.uuid,
                duration: duration
            });
            setTimeout(() => {
                resolve("result");
            }, 10000);
        });
    }

    recStart(){
        this.recStartMoment = moment();

        this.mixpanel.track('IDE_FEATURE_REC_START', {
            distinct_id: this.uuid,
            recorder_type: 'web'
        });
    }

    recStop(recorded_items_count){
        const recStopMoment = moment();
        const duration = recStopMoment.diff(this.recStartMoment, 'seconds');
        this.mixpanel.track('IDE_FEATURE_REC_END', {
            distinct_id: this.uuid,
            recorder_type: 'web',
            duration: duration,
            recorded_items_count: recorded_items_count || 0
        });
        this.recStartMoment = null;
    }

    playStart(){
        this.playStartMoment = moment();

        this.mixpanel.track('IDE_FEATURE_PLAY_START', {
            distinct_id: this.uuid,
            playback_type: 'web'
        });
    }

    playStop(summary){
        const playStopMoment = moment();
        const duration = playStopMoment.diff(this.playStartMoment, 'seconds');

        this.mixpanel.track('IDE_FEATURE_PLAY_END', {
            distinct_id: this.uuid,
            playback_type: 'web',
            duration: duration,
            test_duration: summary && summary._duration,
            playback_outcome: summary && summary._status
        });

        this.playStartMoment = null;
    }
}
