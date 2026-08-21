// DMG creation part based on https://github.com/rakuten-frontend/grunt-appdmg

var path = require('path');
var fs = require('fs');
var cp = require('child_process');

function parseNotarizationInfo(info) {
    var out = {};
    function matchToProperty(key, r, modifier) {
        var exec = r.exec(info);
        if (exec) {
            out[key] = modifier ? modifier(exec[1]) : exec[1];
        }
    }
    matchToProperty('uuid', /\n *id: (.+?)\n/);
    matchToProperty('date', /\n *createdDate: (.+?)\n/, function(d) { return new Date(d); });
    matchToProperty('status', /\n *status: (.+?)\n/);
    if (out.logFileUrl === '(null)') {
        out.logFileUrl = null;
    }
    return out;
}

function checkNotarizationStatus(uuid) {
    return new Promise(function(resolve, reject) {
        function poll() {
            var notarizeCheck = cp.spawnSync('xcrun', [
                'notarytool', 'info',
                '--apple-id', process.env.APPLE_ID_USR,
                '--password', process.env.APPLE_ID_PWD,
                '--team-id', process.env.APPLE_ID_TEAM,
                uuid
            ]);
            if (notarizeCheck.status !== 0) {
                reject(new Error('Failure checking for notarization status:\n' + notarizeCheck.output));
                return;
            }

            var notarizationInfo = parseNotarizationInfo(notarizeCheck.output.toString());
            if (notarizationInfo.status === 'In Progress') {
                console.log('Still in progress, waiting 30 seconds');
                setTimeout(poll, 30 * 1000);
            } else if (notarizationInfo.status === 'Accepted') {
                console.log('Notarization completed successfully!');
                resolve();
            } else {
                reject(new Error('Unrecognized notarization status:' + notarizationInfo.status));
            }
        }
        poll();
    });
}

// Builds, notarizes, and staples the macOS DMG installer.
// `outDir` is the absolute path to the build output (OUTDIR, e.g. dist/temp).
function installerDmg(pkgVersion, outDir) {
    // appdmg is a macOS-only optionalDependency (native module) and won't be installed on
    // other platforms. This is only ever invoked on darwin, so requiring it lazily here
    // avoids failing to even load this module on Windows/Linux.
    var appdmg = require('appdmg');

    var appPath = path.resolve(path.join(outDir, 'Oxygen.app'));
    var signIdentity = 'AC2F354E3725BA7C045B0F497895314C3EBC5934';
    var dest = 'dist/oxygen-' + pkgVersion + '-osx-x64.dmg';

    var signNested = cp.spawnSync('python', ['sign-recursively.py', 'sign', signIdentity, appPath], { cwd: __dirname, stdio: 'inherit' });
    if (signNested.status !== 0) {
        return Promise.reject(new Error('Code signing failed with status ' + signNested.status));
    }
    console.log();

    var options = {
        title: 'Oxygen IDE ' + pkgVersion,
        icon: 'resources/app.icns',
        background: 'resources/dmg-background.png',
        window: { size: { width: 627, height: 440 } },
        contents: [
            { x: 442, y: 210, type: 'link', path: '/Applications' },
            { x: 186, y: 210, type: 'file', path: appPath }
        ],
        format: 'UDBZ'
    };

    fs.mkdirSync(path.dirname(dest), { recursive: true });

    return new Promise(function(resolve, reject) {
        var emitter = appdmg({ basepath: process.cwd(), specification: options, target: dest });

        emitter.on('progress', function(info) {
            if (info.type === 'step-begin') {
                var line = '[' + (info.current <= 9 ? ' ' : '') + info.current + '/' + info.total + '] ' + info.title + '...';
                process.stdout.write(line + ' '.repeat(Math.max(0, 45 - line.length)));
            }
            if (info.type === 'step-end') {
                var label = { ok: ' OK ', skip: 'SKIP', error: 'FAIL' }[info.status];
                process.stdout.write('[' + label + ']\n');
            }
        });

        emitter.on('error', function(err) {
            reject(err);
        });

        emitter.on('finish', function() {
            console.log('\nImage: ' + dest + ' created');
            console.log('\nUploading the application for notarization...');
            var notarize = cp.spawnSync('xcrun', [
                'notarytool', 'submit',
                '--apple-id', process.env.APPLE_ID_USR,
                '--password', process.env.APPLE_ID_PWD,
                '--team-id', process.env.APPLE_ID_TEAM,
                path.resolve(dest)
            ]);
            if (notarize.status !== 0) {
                reject(new Error('Notarization submit failed with status ' + notarize.status));
                return;
            }

            var output = notarize.output.toString();
            var uuidMatch = /\n *id: (.+?)\n/.exec(output);
            if (!uuidMatch) {
                reject(new Error('Failed to find request UUID in output:\n' + output));
                return;
            }
            var uuid = uuidMatch[1];
            console.log('Request UUID: ' + uuid);
            console.log('\nChecking notarization status...');

            setTimeout(function() {
                checkNotarizationStatus(uuid).then(function() {
                    console.log('\nStapling the ticket to DMG...');
                    var stapler = cp.spawnSync('xcrun', ['stapler', 'staple', path.resolve(dest)]);
                    if (stapler.status !== 0) {
                        reject(new Error('Failure stapling the ticket:\n' + stapler.output));
                        return;
                    }
                    resolve();
                }, reject);
            }, 30 * 1000);
        });
    });
}

module.exports = installerDmg;
