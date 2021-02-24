
import ServiceBase from './ServiceBase';
import * as Sentry from '@sentry/electron';
export const JAVA_NOT_FOUND = 'JAVA_NOT_FOUND';
export const JAVA_BAD_VERSION = 'JAVA_BAD_VERSION';

const reportErrorToSentry = (error) => {
    if (Sentry && Sentry.captureException) {
        Sentry.captureException(error);
    }
};

const javaversion = (callback) => {
    try {
        var output = '';
        const cp = require('child_process').spawn('java', ['-version']);
        cp.on('error', (err) => {
            console.error('java -version child process error. ', err);
            reportErrorToSentry(err);
            return callback(null);
        });
        cp.stdout.on('data', (data) => {
            output += data.toString();
        });
        cp.stderr.on('data', (data) => {
            output += data.toString();
        });
        cp.on('close', (code) => {
            // Java 8 or lower: 1.6.0_23, 1.7.0, 1.7.0_80, 1.8.0_211
            // Java 9 or higher: 9.0.1, 11.0.4, 12, 12.0.1
            // eslint-disable-next-line no-useless-escape
            var matches = output.match(/"(\d+\.?\d+)[\._\-\d+]*"/);
            let javaVersion = matches ? matches[1] : null;
            if (!javaVersion) {
                const errorMessage = 'java -version mismatch error:\n' + output;
                console.error(errorMessage);
                
                const e = new Error(errorMessage);
                reportErrorToSentry(e);
            }
            return callback(javaVersion);
        });
    } catch (e) {
        console.error(e);
        reportErrorToSentry(e);
    }
};

export default class JavaService extends ServiceBase {
    constructor(mainWindow) {
        super(mainWindow);
    }

    checkJavaVersion() {
        try {
            javaversion((version) => {
                if (version) {
                    var ver = version.split('.');
                    if (ver[0] === '1' && ver[1] !== '8' /*lower than 1.8*/ ) {
                        this.notify({
                            type: JAVA_BAD_VERSION,
                            payload: {
                                version: version
                            }
                        });
                    }
                } else {
                    this.notify({
                        type: JAVA_NOT_FOUND
                    });
                }
            });
        } catch (e) {
            console.error(e);
            reportErrorToSentry(e);
        }
    }
}