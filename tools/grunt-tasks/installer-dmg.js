'use strict';

// DMG creation part based on https://github.com/rakuten-frontend/grunt-appdmg

var path = require('path');
var appdmg = require('appdmg');
var chalk = require('chalk');
var repeatString = require('repeat-string');
var cp = require('child_process');

module.exports = function (grunt) {
  grunt.registerMultiTask('installer-dmg', 'Generate notarized DMG-images for Mac OSX', function () {
    var options = this.options();
    var done = this.async();

    if (options.configFile) {
      grunt.log.warn('"configFile" option has been deprecated.');
      delete options.configFile;
    }

    var basepath = options.basepath || process.cwd();
    delete options.basepath;

    var appPath = path.resolve(options.contents[1].path);
    var signIdentity = grunt.config.get('installer-dmg').target['sign-identity'];
    var signNested = cp.spawnSync('python', ['sign-recursively.py', 'sign', signIdentity, appPath], { cwd: __dirname, stdio: 'inherit' });
    if (signNested.status !== 0) {
      done(false);
    }
    grunt.log.writeln();

    // Iterate over all specified file groups.
    this.files.forEach(function (filePair) {
      var dirname = path.dirname(filePair.dest);
      var emitter;

      // Create directory beforehand to prevent error.
      grunt.file.mkdir(dirname);

      // Run appdmg module.
      emitter = appdmg({basepath: basepath, specification: options, target: filePair.dest});

      // Logging.
      // This should be removed when appdmg provides logging method.
      emitter.on('progress', function (info) {
        if (info.type === 'step-begin') {
          var line = '[' + (info.current <= 9 ? ' ' : '') + info.current + '/' + info.total + '] ' + info.title + '...';
          grunt.log.write(line + repeatString(' ', 45 - line.length));
        }

        if (info.type === 'step-end') {
          var op = ({
            ok: ['green', ' OK '],
            skip: ['yellow', 'SKIP'],
            error: ['red', 'FAIL']
          }[info.status]);
          grunt.log.write('[' + chalk[op[0]](op[1]) + ']\n');
        }
      });

      emitter.on('finish', function () {
        grunt.log.writeln('\nImage: ' + chalk.cyan(filePair.dest) + ' created');
        grunt.log.writeln('\nUploading the application for notarization...');
        var notarize = cp.spawnSync('xcrun', [
          'altool',
          '--notarize-app',
          '-t', 'osx',
          '-f', path.resolve(filePair.dest),
          '--primary-bundle-id', 'org.oxygen.ide',
          '-u', process.env.APPLE_ID_USR,
          '-p', process.env.APPLE_ID_PWD 
        ]);
        if (notarize.status !== 0) {
          done(false);
        }

        var uuidMatch = /\nRequestUUID = (.+?)\n/g.exec(notarize.output);
        if (!uuidMatch) {
          grunt.log.error('Failed to find request UUID in output:\n' + notarize.output);
          done(false);
        }
        var uuid = uuidMatch[1];
        grunt.log.writeln('Request UUID: ' + uuid);
        grunt.log.writeln('\nChecking notarization status...');
        setTimeout(checkNotarizationStatus.bind(null, uuid), 30*1000);
      });

      emitter.on('error', function (err) {
        grunt.log.error(err.toString());
        done(false);
      });

      function parseNotarizationInfo(info) {
        var out = {};
        var matchToProperty = function (key, r, modifier) {
            var exec = r.exec(info);
            if (exec) {
                out[key] = modifier ? modifier(exec[1]) : exec[1];
            }
        };
        matchToProperty('uuid', /\n *RequestUUID: (.+?)\n/);
        matchToProperty('date', /\n *Date: (.+?)\n/, function (d) { return new Date(d); });
        matchToProperty('status', /\n *Status: (.+?)\n/);
        matchToProperty('logFileUrl', /\n *LogFileURL: (.+?)\n/);
        matchToProperty('statusCode', /\n *Status Code: (.+?)\n/, function (n) { return parseInt(n, 10); });
        matchToProperty('statusMessage', /\n *Status Message: (.+?)\n/);
        if (out.logFileUrl === '(null)') {
            out.logFileUrl = null;
        }
        return out;
      }

      function checkNotarizationStatus(uuid) {
        var notarizeCheck = cp.spawnSync('xcrun', [
          'altool',
          '--notarization-info', uuid,
          '-u', process.env.APPLE_ID_USR,
          '-p', process.env.APPLE_ID_PWD
        ]);
        if (notarizeCheck.status !== 0) {
          grunt.log.error('Failure checking for notarization status:\n' + notarizeCheck.output);
          done(false);
        }

        var notarizationInfo = parseNotarizationInfo(notarizeCheck.output);
        if (notarizationInfo.status === 'in progress') {
          grunt.log.writeln('Still in progress, waiting 30 seconds');
          setTimeout(checkNotarizationStatus.bind(null, uuid), 30*1000);
        } else if (notarizationInfo.status === 'invalid') {
          grunt.log.error('Apple failed to notarize your application, check the logs for more info\n\nStatus Code: ' + (notarizationInfo.statusCode || 'No Code') + '\nMessage: ' + (notarizationInfo.statusMessage || 'No Message') + '\nLogs: ' + notarizationInfo.logFileUrl);
          done(false);
        } else if (notarizationInfo.status === 'success') {
          grunt.log.writeln('Notarization completed successfully!');
          grunt.log.writeln('\nStapling the ticket to DMG...');
          var stapler = cp.spawnSync('xcrun', [
            'stapler',
            'staple',
            path.resolve(filePair.dest)
          ]);
          if (stapler.status !== 0) {
            grunt.log.error('Failure stapling the ticket:\n' + stapler.output);
            done(false);
          }
          done();
        } else {
          grunt.log.error('Unrecognized notarization status:' + notarizationInfo.status);
          done(false);
        }
      }
    });
  });
};
