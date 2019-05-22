import { ipcRenderer } from 'electron';
const path = require('path');
const os = require('os');

export const JAVA_ERROR_INFO = 'JAVA_ERROR_INFO';
export const JAVA_NOT_FOUND = 'JAVA_NOT_FOUND';
export const JAVA_BAD_VERSION = 'JAVA_BAD_VERSION';

export default class JavaService {

  constructor(store) {
    // console.log('~JavaService elive');
  }
  

  chromeVersion(){
    console.log('chromeVersion');

    if (os.platform() === 'win32') {
      try {
        const process = require('child_process');   
        const spawn = process.spawn(path.resolve(__dirname, 'services', 'get_chrome_versions.bat'));
        spawn.on('error', function(err){
          console.log('QQ error', err);
        });
        spawn.stdout.on('data', function (data) {
          console.log('QQ ',data);
          console.log('QQ ',data.toString());
          console.log('QQ ',data.toString().split('\n'));
  
          try {
            let cmdOut = data.toString().split('\n');
            let infoArray;
  
            if(Array.isArray(cmdOut)){
              infoArray = cmdOut.filter(function (el) {
                console.log('el', el);
                console.log('el.length', el.length);
                return el.length > 1;
              });
            }
  
            console.log('QQ infoArray',infoArray);
  
            if(Array.isArray(infoArray) && infoArray.length === 6){
              const lineWithVersion = infoArray['3'];
              const lineWithVersionSplit = lineWithVersion.split(' ');
              console.log('lineWithVersion', lineWithVersion);
              console.log('lineWithVersionSplit', lineWithVersionSplit);
  
              if(Array.isArray(lineWithVersionSplit) && lineWithVersionSplit.length){
                alert('Chrome version '+ lineWithVersionSplit[lineWithVersionSplit.length - 1]);
              }
            }
            
          } catch(e){
            console.log('QQ e', e);
          }
        });
        // spawn.stderr.on('data', function (data) {
        //   console.log('QQ ',data);
        //   console.log('QQ ',data.toString());
        // });
        spawn.on('close', function (code) {
          if (code == 0)
                console.log('QQ Stop');
          else
                console.log('QQ Start');
        });
      } catch(e){
        console.log('QQ e', e);
      }
    } else {
      const spawn = require('child_process').spawn('/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome', ['--version']);
      spawn.on('error', function(err){
        console.log('QQ error', err);
      });

      spawn.stdout.on('data', function (data) {
        console.log('QQ ',data);
        console.log('QQ ',data.toString());
        console.log('QQ ',data.toString().split('\n'));

        let cmdOut = data.toString().split('\n');

        if(cmdOut && cmdOut[0]){
          const ArrFromStrWithChromeVersion = cmdOut[0].trim().split(' ');
          console.log('QQ ArrFromStrWithChromeVersion',ArrFromStrWithChromeVersion);
          if(Array.isArray(ArrFromStrWithChromeVersion) && ArrFromStrWithChromeVersion.length && ArrFromStrWithChromeVersion.length === 3){
            alert('Chrome version '+ ArrFromStrWithChromeVersion[2]);
          }
        }
      });
    }
  }

  javaversion(callback) {
    try {
      const spawn = require('child_process').spawn('java', ['-version']);
      spawn.on('error', function(err){
          return callback(err, null);
      })
      spawn.stderr.on('data', function(data) {
          if (process.platform === 'win32') {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
            if (javaVersion != false) {
                return callback(null, javaVersion);
            } else {
              return callback(null, false);
            }
          } else {
            data = data.toString().split('\n')[0];
            var javaVersion = new RegExp('openjdk version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
            console.log('javaVersion', javaVersion);
            if (javaVersion != false) {
              return callback(null, javaVersion);
            } else {
              return callback(null, false);
            }
          }
      });
    } catch(e){
      callback('catch', e);
    }
  }


  bind(store, action$) {
    this.store = store;
    this.action$ = action$;
    
    this.chromeVersion();
    this.javaversion(function(err,version){    
      if(version && typeof version === 'string' && version.startsWith('1.8')){
        // do nothing, java version is correct;
      } else if(version && typeof version === 'string' && !version.startsWith('1.8')){
        const message = `Java 8 is required to run test, but currently installed version is ${version}.
        Please install the JDK v1.8 : `;        
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
        Please install the JDK v1.8 : `;
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