/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var path = require('path');
var modclean = require('modclean');
var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerTask('module-cleanup', 'Removes unneeded files from node_modules', function() {
        var done = this.async();

        new modclean.ModClean({
            cwd: path.join(process.cwd(), 'app', 'node_modules'),
            patterns: ['default:safe'],
            additionalPatterns: [
                'doc', 'docs', 'documentation',
                'LICENSE.*', 'LICENSE',
                'coverage',
                '*.txt',
                'gruntfile.js',
                'quick-test.js',
                '*.c', '*.cpp',
                '*.d.ts', '*.d.ts.map',
                'yarn.lock', 'package-lock.json',
                '*.html', '*.htm', '*.png', '*.map'],
            test: true
        }, function(err, results) {
            if (err) {
                grunt.fail.fatal('Error while cleaning up modules', err);
            }
            
            var syncConfig = grunt.config.get(['copy']);
            var syncSrcs = syncConfig.main.files[0].src;

            var count = 0;
            for (var file of results) {
                if (file) {
                    var isdir = fs.statSync(path.join(process.cwd(), 'app', 'node_modules', file)).isDirectory();
                    syncSrcs.push(isdir ? '!' + file + '/**' : '!' + file);
                    count++;
                }
            }
            
            grunt.log.ok('Excluded ' + count + ' files');
            grunt.config.set(['copy'], syncConfig);
            
            done(true);
        });
    });
};

