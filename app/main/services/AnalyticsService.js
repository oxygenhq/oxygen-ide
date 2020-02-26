/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import Mixpanel from 'mixpanel';
import ServiceBase from './ServiceBase';
import moment from 'moment';
import { version }  from '../../../package.json';
import os from 'os';
import uuidv4 from'uuid/v4';
import * as Sentry from '@sentry/electron';

export default class AnalyticsService extends ServiceBase {
    constructor() {
        super();
        this.uuid = null;
        this.mixpanel = null;
        
        try{
            if (process.env.NODE_ENV === 'production') {
                this.mixpanel = Mixpanel.init('e80db0ad2789b5718fa1b84b6661f008');
            }
        } catch(e){
            console.warn('Mixpanel error: ', e);
            Sentry.captureException(e);
        }
    }

    async dispose() {
        await this.ideClose();
    }

    getUserId(){
        if(this.uuid){
            return this.uuid;
        } else {
            try{
                this.uuid = uuidv4();
            } catch(e){
                console.log('uuidv4 e', e);
            }
            return this.uuid;
        }
    }

    setUser(uuid){
        if(uuid){
            this.uuid = uuid;
        } else {
            this.uuid = uuidv4();
        }
        this.ideOpen();
    }

    async createUser(uuid){
        if(uuid){
            this.uuid = uuid;
        } else {
            try{
                this.uuid = uuidv4();
            } catch(e){
                console.log('createUser e', e);
            }
        }

        let region = 'unknown';
        let country_code = 'unknown';
        let country_name = 'unknown';
        let city = 'unknown';
        let continent_name = 'unknown';
        let continent_code = 'unknown';
        let language = 'unknown';

        try{
            const { net } = require('electron');
            const request = net.request('https://api.ipdata.co/?api-key=143415c75d2d5036d29cc48ecb1c742bfef9ab3f25af45fbd0939367');
            request.on('response', (response) => {
                response.on('data', (chunk) => {
                    try{
                        var json = JSON.parse(chunk);
    
                        if(json){
                            if(json.country_code){
                                country_code = json.country_code;
                            }

                            if(json.country_name){
                                country_name = json.country_name;
                            }
                                
                            if(json.region){
                                region = json.region;
                            }

                            if(json.city){
                                city = json.city;
                            }

                            if(json.continent_name){
                                continent_name = json.continent_name;
                            }

                            if(json.continent_code){
                                continent_code = json.continent_code;
                            }

                            try{
                                if(this.mixpanel && this.mixpanel.people && this.mixpanel.people.set){
                                    this.mixpanel.people.set(this.uuid, {
                                        $region: region,
                                        $country_code: country_code,
                                        'Сountry Name': country_name,
                                        'City': city,
                                        'Continent Name': continent_name,
                                        'Continent Code': continent_code
                                    });
                                }
                            } catch(e){
                                console.warn('mixpanel e', e);
                                Sentry.captureException(e);
                            }
                        }
                    } catch(e){
                        console.warn('e',e);
                        Sentry.captureException(e);
                    }
                });
                response.on('end', () => {
                    // console.log('No more data in response.')
                });
            });
            request.on('error', (err) => {
                console.log('ipdata request error', err);
            });
            request.end();
        } catch(e){
            console.warn('e', e);
            Sentry.captureException(e);
        }

        
        try{
            if(this.mixpanel && this.mixpanel.people && this.mixpanel.people.set){
                this.mixpanel.people.set(this.uuid, {
                    $created: (new Date()).toISOString(),
                    $timezone: ''+moment().format('Z'),
                    'IDE Version': version,
                    'OS Name': process.platform,
                    'OS Version': os.release(),
                    'Language': language,
                    'Dev': process.env.NODE_ENV === 'development'
                }); 
            }

            if (this.mixpanel && this.mixpanel.track) {
                this.mixpanel.track('NEW_USER', {
                    distinct_id: this.uuid
                });
            }
        } catch(e){
            console.warn('mixpanel e', e);
            Sentry.captureException(e);
        }
        this.ideOpen();
    }

    ideOpen(){
        this.openMoment = moment();
        
        try{
            if(this.mixpanel && this.mixpanel.track){
                this.mixpanel.track('IDE_OPEN', {
                    distinct_id: this.uuid
                }); 
            }

            if(Sentry && Sentry.configureScope){
                Sentry.configureScope((scope) => {
                    scope.setUser({'userId': this.uuid});
                });
            }

        } catch(e){
            console.warn('mixpanel e', e);
            Sentry.captureException(e);
        }
    }

    ideClose(){
        return new Promise((resolve, reject) => {    
            const closeMoment = moment();
            const duration = closeMoment.diff(this.openMoment, 'seconds');
            
            try{
                if(this.mixpanel && this.mixpanel.track){
                    this.mixpanel.track('IDE_CLOSE', {
                        distinct_id: this.uuid,
                        'Duration': duration
                    });
                }
            } catch(e){
                console.warn('mixpanel e', e);
                Sentry.captureException(e);
            }
            setTimeout(() => {
                resolve('result');
            }, 2000);
        });
    }

    recStart(){
        this.recStartMoment = moment();

        try{
            
            if(this.mixpanel && this.mixpanel.track){
                this.mixpanel.track('IDE_FEATURE_REC_START', {
                    distinct_id: this.uuid,
                    'Recorder type': 'web'
                });
            }
        } catch(e){
            console.warn('mixpanel e', e);
            Sentry.captureException(e);
        }
    }

    recStop(recorded_items_count){
        const recStopMoment = moment();
        const duration = recStopMoment.diff(this.recStartMoment, 'seconds');
        
        try{
            if(this.mixpanel && this.mixpanel.track){
                this.mixpanel.track('IDE_FEATURE_REC_END', {
                    distinct_id: this.uuid,
                    'Recorder type': 'web',
                    'Duration': duration,
                    'Recorded items count': recorded_items_count || 0
                });
            }
        } catch(e){
            console.warn('mixpanel e', e);
            Sentry.captureException(e);
        }
        this.recStartMoment = null;
    }

    playStart(data = {}){

        this.playStartMoment = moment();

        try{
            if(this.mixpanel && this.mixpanel.track){
                this.mixpanel.track('IDE_FEATURE_PLAY_START', {
                    distinct_id: this.uuid,
                    'Playback type': 'web',
                    ...data
                });
            }
        } catch(e){
            console.warn('mixpanel e', e);
            Sentry.captureException(e);
        }
    }

    playStop(summary){
        const playStopMoment = moment();
        const duration = playStopMoment.diff(this.playStartMoment, 'seconds');

        try{
            if(this.mixpanel && this.mixpanel.track){
                this.mixpanel.track('IDE_FEATURE_PLAY_END', {
                    distinct_id: this.uuid,
                    'Playback type': 'web',
                    'Duration': duration,
                    'Test duration': summary && summary._duration,
                    'Playback outcome': summary && summary._status
                });
            }
        } catch(e){
            console.log('mixpanel e', e);
            Sentry.captureException(e);
        }

        this.playStartMoment = null;
        return true;
    }
}
