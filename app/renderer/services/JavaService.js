export const JAVA_NOT_FOUND = 'JAVA_NOT_FOUND';
export const JAVA_BAD_VERSION = 'JAVA_BAD_VERSION';

const javaversion = (callback) => {
    try {
        var output = '';
        const cp = require('child_process').spawn('java', ['-version']);
        cp.on('error', (err) => {
            console.error('java -version child process error. ', err);
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
            /* eslint-disable */
            var matches = output.match(/"(\d+\.?\d+)[\._\-\d+]*"/);
            /* eslint-enable */
            let javaVersion = matches ? matches[1] : null;
            if (!javaVersion) {
                console.error('java -version mismatch error:\n' + output);
            }
            return callback(javaVersion);
        });
    } catch(e){

        if(window && window.Sentry && window.Sentry.captureException){
            window.Sentry.captureException(e);
        }

        console.error('java -version spawn error. ', e);
    }
};

export default class JavaService {
    constructor(store) {
    }

    checkJavaVersion() {
        if(window && window.dispatch){
            javaversion((version) => {
                if (version) {
                    var ver = version.split('.');
                    if (ver[0] == 1 && ver[1] != 8 /*lower than 1.8*/ || ver[0] > 10 /*higher than 10*/) {
                        window.dispatch({
                            type: JAVA_BAD_VERSION,
                            payload: {
                                version: version
                            }
                        });
                    }
                } else {
                    window.dispatch({
                        type: JAVA_NOT_FOUND
                    });
                }
            });
        }
    }
}
