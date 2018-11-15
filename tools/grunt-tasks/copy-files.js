/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var copy = require('recursive-copy');

module.exports = function(grunt) {
    grunt.registerTask('copy-files', 'Copy a folder recursivly', function() {
        var done = this.async();
        var cfg = grunt.config.get('copy-files');
        copy(cfg.src, cfg.dest, function(err, results) {
            if (err) {
                grunt.fail.fatal(err);
            } else {
                grunt.log.writeln('Copied ' + results.length + ' files');
                done(true);
            }
        });
    });
};
