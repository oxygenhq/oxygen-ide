/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs');
var archiver = require('archiver');

module.exports = function(grunt) {
    grunt.registerTask('compress', 'ZIP a directory', function(name) {
        var done = this.async();
        try {
            var cfg = grunt.config.get('compress')[name];

            var output = fs.createWriteStream(cfg.dest);
            var archive = archiver('zip', {
                zlib: { level: 9 }
            });

            output.on('close', function() {
                grunt.log.ok('Done');
                done(true);
            });

            archive.on('error', function(err) {
              grunt.fail.fatal(err);
            });

            archive.pipe(output);

            archive.directory(cfg.src, '');

            archive.finalize();
        } catch (e) {
            grunt.fail.fatal(e);
        }
    });
};
