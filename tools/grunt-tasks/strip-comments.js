/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs');
var glob = require('glob');
var Terser = require('terser');

module.exports = function(grunt) {
    grunt.registerTask('strip-comments', 'Remove comments from JS files', function(pathCfg) {
        try {
            var globPath = grunt.config.get('strip-comments')[pathCfg];
            var paths = glob.sync(globPath);
            for (var path of paths) {
                grunt.log.writeln(path);
                var code = fs.readFileSync(path, { encoding: 'utf8' });
                var result = Terser.minify(code,
                    {
                        mangle: false,
                        compress: null,
                        output: {
                            comments: false,
                            beautify: true,
                            indent_level: 2,
                            keep_numbers: true
                        }
                    });
                fs.writeFileSync(path, result.code);
            }
            grunt.log.ok('Done');
        } catch (e) {
            grunt.fail.fatal(e);
        }
    });
};
