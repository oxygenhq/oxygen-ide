/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var cp = require('child_process');
var os = require('os');

module.exports = function(grunt) {
    grunt.registerTask('installer-win', 'Creates setup package for the Windows platform.', function() {
        if (os.platform() === 'win32') {
            var cfg = grunt.config.get('installer-win');
            var wixRoot = 'tools\\installer-win\\';
            var arch = cfg.arch === 'x64' ? 'x64' : 'x86';
            var version = cfg.version;
            // since MSI doesn't support semantic versioning and only supports
            // major.minor.build version types, we convert any RC to the format it can handle
            // using an approach similar to https://github.com/semver/semver/issues/332
            //
            // X.Y.Z-rc.N
            // 1.8.0-rc.1  = 1.8.10001
            // 1.8.0-rc.2  = 1.8.10002
            // 1.8.0       = 1.8.10100
            // 1.8.1-rc.1  = 1.8.10101
            // 1.8.1-rc.2  = 1.8.10102
            // 1.8.1       = 1.8.10200
            // 1.8.2-rc.1  = 1.8.10201
            // 1.8.2-rc.2  = 1.8.10202
            // 1.8.2       = 1.8.10300

            var x, y, z, n;
            if (version.indexOf('-rc') > 0) {
                let tokens = version.replace('-rc', '').split('.');
                x = tokens[0];
                y = tokens[1];
                z = tokens[2];
                n = tokens[3];
                if (z > 500 || n > 99) {
                    grunt.fail.fatal('Invalid version specified: ' + version);
                }
            } else if (version.indexOf('-') > 0) {
                grunt.fail.fatal('Invalid version specified: ' + version);
            } else {
                let tokens = version.split('.');
                x = tokens[0];
                y = tokens[1];
                z = tokens[2];
                n = 100;
            }
            version = x + '.' + y + '.' + (10000 + parseInt(z) * 100 + parseInt(n));

            // WiX v5's unified CLI replaces the old heat+candle+light pipeline with a single
            // build step. Harvesting (formerly heat, driven by files.xslt) is now done at build
            // time by the <Files> element in files.wxs itself, bound to dist\temp via the named
            // "appfiles" bind path below.
            //
            // This runs with cwd left at the repo root, same as the rest of this build tooling.
            // Two different path-resolution rules are in play, though: the "appfiles" bind path
            // is a real bind path used by files.wxs's <Files> harvesting, which WiX always
            // resolves relative to the .wxs file that uses it (tools\installer-win) regardless of
            // cwd — hence "..\\..\\dist\\temp" here — whereas config.wxs/files.wxs's other
            // relative references (WixVariable, Icon, File/@Source) are plain attribute text
            // resolved relative to wix.exe's own working directory (the repo root), and are
            // authored accordingly inside those files. See the comments in files.wxs/config.wxs.
            cp.execFileSync('wix',
                [ 'build',
                    '-arch', arch,
                    '-d', 'Version=' + version,
                    '-b', 'appfiles=..\\..\\dist\\temp',
                    '-ext', 'WixToolset.Firewall.wixext',
                    '-ext', 'WixToolset.UI.wixext',
                    '-ext', 'WixToolset.Util.wixext',
                    '-pdbtype', 'none',
                    '-o', 'dist\\oxygen-' + cfg.version + '-win-' + cfg.arch + '.msi',
                    wixRoot + 'config.wxs',
                    wixRoot + 'files.wxs'],
                { stdio : 'inherit' });
        }
    });
};
