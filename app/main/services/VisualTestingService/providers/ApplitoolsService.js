import VisualTestingProviderBase from '../VisualTestingProviderBase';

export default class ApplitoolsService extends VisualTestingProviderBase {
    constructor(settings) {
        super(settings);
        this.isRunning = false;
    }

    start() {
        if (!this.settings || !this.settings.inUse) {
            return;
        }
        this.isRunning = true;
    }

    stop() {
        this.isRunning = false;
    }

    isRunning() {
        return this.isRunning;
    }

    updateSettings(settings){
        this.settings=settings;
    }

    updateOptions(inputOptions = {}){
        const options = {...inputOptions};
        if (!this.settings || typeof this.settings !== 'object') {
            throw new Error('"settings" must not be null');
        }

        if(this.settings.accessKey && this.settings.inUse){
            options.applitoolsOpts = {
                key: this.settings.accessKey,
                checkOnEveryAction: false
            };

            if(this.settings.checkOnEveryAction){
                options.applitoolsOpts.checkOnEveryAction = true;
            }
        }

        return options;
    }
}