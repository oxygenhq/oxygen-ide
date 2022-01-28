import ServiceBase from './ServiceBase';

const APP_CLOSE_ARE_UNSAVED_FILES = 'APP_CLOSE_HAS_UNSAVED_FILES';

export default class AppCloseService extends ServiceBase {
    constructor() {
        super();

        this.resolve = () => {};
    }

    closeApp() {
        this.resolve(true);
    }

    stayAppOpened() {
        this.resolve(false);
    }

    requestHasUnsavedFilesBeforeClose() {
        this.notify({
            type: APP_CLOSE_ARE_UNSAVED_FILES
        });

        return new Promise((resolve) => {
            this.resolve = resolve;
        });
    }
}