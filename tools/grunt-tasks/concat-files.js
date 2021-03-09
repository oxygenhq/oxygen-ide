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
    grunt.registerMultiTask('concat-files', 'Concatenate multiple files into one', function() {
        var cwd = process.cwd();
        
        try {
            var bundle = '';
            for (var script of this.data.src) {
                bundle += fs.readFileSync(path.join(cwd, script));
            }
            for (var dest of this.data.dest) {
                var destFilename = path.join(cwd, dest);
                fs.writeFileSync(destFilename, bundle);
            }
        } catch (err) {
            grunt.fail.fatal('Error concatenating files', err);
        }

        grunt.log.writeln('Final file size: ' + bundle.length + ' bytes');
    });
};

