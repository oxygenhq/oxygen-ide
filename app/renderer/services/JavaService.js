export const JAVA_NOT_FOUND = 'JAVA_NOT_FOUND';
export const JAVA_BAD_VERSION = 'JAVA_BAD_VERSION';

const javaversion = (callback) => {
  try {
    const spawn = require('child_process').spawn('java', ['-version']);
    spawn.on('error', function(err){
        return callback(err, null);
    })
    spawn.stderr.on('data', function(data) {
      // Java 8 or lower: 1.6.0_23, 1.7.0, 1.7.0_80, 1.8.0_211
      // Java 9 or higher: 9.0.1, 11.0.4, 12, 12.0.1
      var matches = data.toString().match(/"(\d+\.?\d+)[\._\-\d+]*"/)
      let javaVersion = matches ? matches[1] : null;
      return callback(null, javaVersion);
    });
  } catch(e){
    callback('catch', e);
  }
}

export default class JavaService {
  constructor(store) {
  }

  checkJavaVersion() {
    if(window && window.dispatch){
      javaversion(function(err,version){

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
      })
    }
  }
}
