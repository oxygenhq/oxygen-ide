var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');

// Cleans up, rebrands, and prepares the packaged Electron app for distribution.
// `distDir` must be an absolute path to the build output (OUTDIR, e.g. dist/temp).
function rebrand(distDir, name, version) {
    var electronExe = 'electron';
    var electronExeDarwin = 'Electron';

    if (os.platform() === 'win32') {
        // remove unnecessary folders/files
        fs.unlinkSync(path.join(distDir, 'resources', 'default_app.asar'));
        fs.unlinkSync(path.join(distDir, 'version'));

        // re-brand icon & version
        var rceditPath = path.resolve(__dirname, '..', 'rcedit.exe');
        var child = cp.spawnSync(rceditPath,
            [path.join(distDir, electronExe + '.exe'),
                '--set-icon', 'resources/app.ico',
                '--set-file-version', version,
                '--set-product-version', version,
                '--set-version-string', 'LegalCopyright', 'Copyright (C) 2015-2019 CloudBeat Ltd.',
                '--set-version-string', 'ProductName', 'Oxygen IDE',
                '--set-version-string', 'FileDescription', 'Oxygen IDE',
                '--set-version-string', 'CompanyName', 'CloudBeat Ltd.']);
        if (child.error) {
            throw child.error;
        }

        // rename
        fs.renameSync(path.join(distDir, electronExe + '.exe'),
            path.join(distDir, name + '.exe'));
    } else if (os.platform() === 'linux') {
        // remove unnecessary folders/files
        fs.unlinkSync(path.join(distDir, 'version'));

        // rename
        fs.renameSync(path.join(distDir, electronExe),
            path.join(distDir, name));
    } else if (os.platform() === 'darwin') {
        // remove unnecessary folders/files
        fs.unlinkSync(path.join(distDir, 'version'));
        fs.unlinkSync(path.join(distDir, 'LICENSE'));

        // rename
        fs.renameSync(path.join(distDir, 'Electron.app', 'Contents', 'MacOS', electronExeDarwin),
            path.join(distDir, 'Electron.app', 'Contents', 'MacOS', 'Oxygen'));

        fs.renameSync(path.join(distDir, 'Electron.app'),
            path.join(distDir, 'Oxygen.app'));

        // update Info.plist
        var plist = '<?xml version="1.0" encoding="UTF-8"?>' +
                    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">' +
                    '<plist version="1.0"><dict>' +
                        '<key>CFBundleExecutable</key><string>Oxygen</string>' +
                        '<key>CFBundleIconFile</key><string>app.icns</string>' +
                        '<key>CFBundleIdentifier</key><string>org.oxygen.ide</string>' +
                        '<key>CFBundleInfoDictionaryVersion</key><string>6.0</string>' +
                        '<key>CFBundleName</key><string>OxygenIDE</string>' +
                        '<key>CFBundlePackageType</key><string>APPL</string>' +
                        '<key>CFBundleVersion</key><string>%VERSION%</string>' +
                        '<key>LSMinimumSystemVersion</key><string>10.8.0</string>' +
                        '<key>NSMainNibFile</key><string>MainMenu</string>' +
                        '<key>NSPrincipalClass</key><string>AtomApplication</string>' +
                        '<key>NSSupportsAutomaticGraphicsSwitching</key>' +
                        '<true/>' +
                    '</dict></plist>';

        fs.writeFileSync(path.join(distDir, 'Oxygen.app', 'Contents', 'Info.plist'),
            plist.replace('%VERSION%', version));
    }
}

module.exports = rebrand;
