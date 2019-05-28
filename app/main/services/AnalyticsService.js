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
import { version }  from '../../../package.json';
import parser from 'xml2json';
import os from 'os';
import osLocale from 'os-locale';

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

    async createUser(uuid){
        this.uuid = uuid;

        let region = 'unknown';
        let country_code = 'unknown';
        let country_name = 'unknown';
        let city = 'unknown';
        let continent_name = 'unknown';
        let continent_code = 'unknown';
        const env = process.env;
        const language = await osLocale();

        try{
            const { net } = require('electron')
            const request = net.request('https://api.ipdata.co/?api-key=143415c75d2d5036d29cc48ecb1c742bfef9ab3f25af45fbd0939367')
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

                                this.mixpanel.people.set(uuid, {
                                    $region: region,
                                    $country_code: country_code,
                                    'Сountry Name': country_name,
                                    'City': city,
                                    'Continent Name': continent_name,
                                    'Continent Code': continent_code
                                });
                            }
                        } catch(e){
                            console.warn(e);
                        }
                    })
                response.on('end', () => {
                    // console.log('No more data in response.')
                })
            })
            request.end();
        } catch(e){
            console.log('e', e);
        }

        this.mixpanel.people.set(uuid, {
            $created: (new Date()).toISOString(),
            $timezone: ''+moment().format('Z'),
            'IDE Version': version,
            'OS Name': process.platform,
            'OS Version': os.release(),
            'Language': language,
            'Dev': process.env.NODE_ENV === 'development'
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
                'Duration': duration
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
            'Recorder type': 'web'
        });
    }

    recStop(recorded_items_count){
        const recStopMoment = moment();
        const duration = recStopMoment.diff(this.recStartMoment, 'seconds');
        this.mixpanel.track('IDE_FEATURE_REC_END', {
            distinct_id: this.uuid,
            'Recorder type': 'web',
            'Duration': duration,
            'Recorded items count': recorded_items_count || 0
        });
        this.recStartMoment = null;
    }

    playStart(){
        this.playStartMoment = moment();

        this.mixpanel.track('IDE_FEATURE_PLAY_START', {
            distinct_id: this.uuid,
            'Playback type': 'web'
        });
    }

    playStop(summary){
        const playStopMoment = moment();
        const duration = playStopMoment.diff(this.playStartMoment, 'seconds');

        this.mixpanel.track('IDE_FEATURE_PLAY_END', {
            distinct_id: this.uuid,
            'Playback type': 'web',
            'Duration': duration,
            'Test duration': summary && summary._duration,
            'Playback outcome': summary && summary._status
        });

        this.playStartMoment = null;
    }
}
