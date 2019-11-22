export default class CloudProviderBase {
    constructor(settings) {
        this.settings = settings;
    }
    start() {
        throw Error('Not implemented');
    }
    stop() {
        throw Error('Not implemented');
    }
    updateSettings(settings) {
        this.settings = settings;
    }
    // getBrowsersAndDevices();
    updateCapabilities(target, caps) {
        throw Error('Not implemented');
    }
    updateOptions(target, options) {
        throw Error('Not implemented');
    }
}