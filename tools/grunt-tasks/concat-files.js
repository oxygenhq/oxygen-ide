/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs');
var path = require('path');

module.exports = function(grunt) {
    grunt.registerTask('concat-files', 'Concatenate multiple files into one', function() {
        var cfg = grunt.config.get('concat-files');
        var cwd = process.cwd();
        
        try {
            var bundle = '';
            for (var script of cfg.src) {
                bundle += fs.readFileSync(path.join(cwd, script)); 
            }
            for (var dest of cfg.dest) {
                var destFilename = path.join(cwd, dest);
                fs.writeFileSync(destFilename, bundle);
            }
        } catch (err) {
            grunt.fail.fatal('Error concatenating files', err);
        }

        grunt.log.writeln('Final file size: ' + bundle.length + ' bytes');
    });
};

