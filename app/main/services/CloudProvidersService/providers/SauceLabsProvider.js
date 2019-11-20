import ICloudProvider from '../ICloudProvider';
import fetch from 'node-fetch';

export default class SauceLabsProvider extends ICloudProvider {
    getBrowsersAndDevices() {
        return new Promise((resolve, reject) => {
            return fetch('https://saucelabs.com/rest/v1/info/platforms/webdriver')
                .then(response =>  resolve(response.json()))
                .catch(err => reject(err));
        });
    }
}