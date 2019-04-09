import { ipcRenderer } from 'electron';

export const JAVA_ERROR_INFO = 'JAVA_ERROR_INFO';
export const JAVA_NOT_FOUND = 'JAVA_NOT_FOUND';
export const JAVA_BAD_VERSION = 'JAVA_BAD_VERSION';

export default class JavaService {

  constructor(store) {
    console.log('~JavaService elive');
  }
  
  javaversion(callback) {
    try {
      const spawn = require('child_process').spawn('java', ['-version']);
      spawn.on('error', function(err){
          return callback(err, null);
      })
      spawn.stderr.on('data', function(data) {
          data = data.toString().split('\n')[0];
          var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
          if (javaVersion != false) {
              return callback(null, javaVersion);
          } else {
            return callback(null, false);
          }
      });
    } catch(e){
      callback('catch', e);
    }
  }


  bind(store, action$) {
    this.store = store;
    this.action$ = action$;
    
    this.javaversion(function(err,version){    
      if(version && typeof version === 'string' && version.startsWith('1.8')){
        // do nothing, java version is correct;
      } else if(version && typeof version === 'string' && !version.startsWith('1.8')){
        const message = `Java 8 is required to run test, but currently installed version is ${version}.
        “Please install the JDK v1.8 `;        
        store.dispatch({
          type: JAVA_BAD_VERSION,
          payload: {
            version: version,
            message: message
          }
        });
        // do nothing, java version is correct;
      } else if(version && typeof version === 'boolean' && !version ){
        const message = `“Java installation was either not found.
        “Please install the JDK v1.8 ”`;
        store.dispatch({
            type: JAVA_NOT_FOUND,
            message: message
        });
      } else if(err){    
        store.dispatch({
            type: JAVA_ERROR_INFO,
            payload: { err: err },
        });
        
      } else {
        store.dispatch({
            type: JAVA_ERROR_INFO,
            payload: { err: err },
        });
      }
    })
  }
}