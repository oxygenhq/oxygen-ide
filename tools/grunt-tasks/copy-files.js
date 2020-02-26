/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs-extra');

module.exports = function(grunt) {
    grunt.registerTask('copy-files', 'Copy a folder recursively', function() {
        var done = this.async();
        var cfg = grunt.config.get('copy-files');
        fs.copy(cfg.src, cfg.dest, function (err) {
            if (err){
                grunt.fail.fatal(err);
            }
            grunt.log.ok('Done');
            done(true);
        });
    });
};
