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
        const env = process.env;
        const language = await osLocale();

        try{
            const { net } = require('electron')
            const request = net.request('http://api.hostip.info')
            request.on('response', (response) => {
                    response.on('data', (chunk) => {
                        var json = JSON.parse(parser.toJson(chunk, {reversible: true}));

                        if(json && json['HostipLookupResultSet']){
                            if(json['HostipLookupResultSet']['gml:featureMember']){
                                if(json['HostipLookupResultSet']['gml:featureMember']['Hostip']){
                                    const Hostip = json['HostipLookupResultSet']['gml:featureMember']['Hostip'];

                                    if(Hostip){
                                        if(Hostip && Hostip['gml:name'] && Hostip['gml:name']['$t']){
                                            region = Hostip['gml:name']['$t'];
                                        }
                                        if(Hostip && Hostip['countryName'] && Hostip['countryName']['$t']){
                                            country_name = Hostip['countryName']['$t'];
                                        }
                                        if(Hostip && Hostip['countryAbbrev'] && Hostip['gml:name']['$t']){
                                            country_code = Hostip['countryAbbrev']['$t'];
                                        }
                                        this.mixpanel.people.append(uuid, {
                                            $region: region,
                                            $country_code: country_code,
                                            'Сountry Name': country_name,
                                        });                                       
                                    }
                                }
                            }
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
