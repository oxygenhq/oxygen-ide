import ICloudProvider from '../ICloudProvider';
import fetch from 'node-fetch';

export default class LambdaTestService extends ICloudProvider {
    getBrowsersAndDevices(userName, key) {
        return new Promise((resolve, reject) => {
            let headers = new fetch.Headers();
            headers.set('Authorization', 'Basic ' + Buffer.from(userName + ':' + key).toString('base64'));
            return fetch('https://api.lambdatest.com/automation/api/v1/platforms',{
                method:'GET',
                headers: headers,
            })
                .then(response => resolve(response.json()))
                .catch(err => reject(err));
        });
    }
}