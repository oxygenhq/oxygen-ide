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
            var ieAddonRoot = 'browser-extensions\\ie\\bin\\Release';
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
                var tokens = version.replace('-rc', '').split('.');
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
                var tokens = version.split('.');
                x = tokens[0];
                y = tokens[1];
                z = tokens[2];
                n = 100;
            }
            version = x + '.' + y + '.' + (10000 + parseInt(z) * 100 + parseInt(n));
            
            cp.execFileSync('heat', 
                            [ 'file', ieAddonRoot + '\\IEAddon.dll',
                              '-srd',
                              '-gg',
                              '-cg', 'IEAddonDLL',
                              '-out', wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                                        
            cp.execFileSync('heat', 
                            [ 'dir', 'dist\\temp',
                              '-o', wixRoot + 'files.wxs',
                              '-scom',
                              '-frag',
                              '-srd',
                              '-sreg',
                              '-gg',
                              '-cg', 'ApplicationFiles',
                              '-dr', 'INSTALLFOLDER',
                              '-t', wixRoot + 'files.xslt'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-dVersion=' + version,
                              '-ext', 'WixFirewallExtension',
                              '-ext', 'WixUtilExtension',
                              '-o', wixRoot + 'config.wixobj',
                              wixRoot + 'config.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', arch,
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'files.wixobj',
                              wixRoot + 'files.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('candle', 
                            [ '-arch', 'x86',
                              '-ext', 'WixFirewallExtension',
                              '-o', wixRoot + 'ie_addon.wixobj',
                              wixRoot + 'ie_addon.wxs'],
                            { stdio : 'inherit'});
                            
            cp.execFileSync('light', 
                            [ '-ext', 'WixNetFxExtension',
                              '-ext', 'WixUIExtension',
                              '-ext', 'WixFirewallExtension',
                              '-ext', 'WixUtilExtension',
                              '-spdb',
                              '-sice:ICE60',
                              '-b', 'dist\\temp',
                              '-b', ieAddonRoot,
                              '-o', 'dist\\oxygen-' + cfg.version + '-win-' + cfg.arch + '.msi',
                              wixRoot + 'config.wixobj',
                              wixRoot + 'files.wixobj',
                              wixRoot + 'ie_addon.wixobj'],
                            { stdio : 'inherit'});
        }
    });
};
