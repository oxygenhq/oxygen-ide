/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs');
var cp = require('child_process');
var path = require('path');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('rebrand', 'Cleans up, rebrands, and prepares Oxygen for distribution', function() {
        var cfg = grunt.config.get('rebrand');
        var distPath = path.resolve(__dirname, '..', '..', cfg.dist);
        const electronExe = 'electron';
        const electronExeDarwin = 'Electron';

        if (os.platform() === 'win32') {
            // remove unnecessary folders/files
            fs.unlinkSync(cfg.dist + '/resources/default_app.asar');
            fs.unlinkSync(path.join(distPath, 'version'));

            // re-brand icon & version
            var child = cp.spawnSync(path.resolve(__dirname, 'rcedit.exe'), 
                                    [ path.join(distPath, electronExe + '.exe'), 
                                      '--set-icon', 'resources/app.ico',
                                      '--set-file-version', cfg.version,
                                      '--set-product-version', cfg.version,
                                      '--set-version-string', 'LegalCopyright', 'Copyright (C) 2015-2017 CloudBeat Ltd.',
                                      '--set-version-string', 'ProductName', 'Oxygen IDE',
                                      '--set-version-string', 'FileDescription', 'Oxygen IDE']);
            if (child.error) {
                grunt.fail.fatal(child.error);
            }

            // rename
            fs.renameSync(path.join(distPath, electronExe + '.exe'), 
                            cfg.dist + '/' + cfg.name + '.exe');
        } else if (os.platform() === 'linux') {
            // remove unnecessary folders/files
            fs.unlinkSync(path.join(distPath, 'version'));

            // rename
            fs.renameSync(path.join(distPath, electronExe), 
                            cfg.dist + '/' + cfg.name);
        } else if (os.platform() === 'darwin') {
            // remove unnecessary folders/files
            fs.unlinkSync(path.join(distPath, 'version'));
            fs.unlinkSync(path.join(distPath, 'LICENSE'));

            // rename
            fs.renameSync(cfg.dist + '/Electron.app/Contents/MacOS/' + electronExeDarwin, 
                            cfg.dist + '/Electron.app/Contents/MacOS/Oxygen');
                            
            fs.renameSync(cfg.dist + '/Electron.app', 
                            cfg.dist + '/Oxygen.app');
                            
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

            fs.writeFileSync(cfg.dist + '/Oxygen.app/Contents/Info.plist', 
                            plist.replace('%VERSION%', cfg.version));
        }
    });
};
