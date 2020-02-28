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
    grunt.registerTask('clean', 'Recursively remove everything inside a directory', function(pathCfg) {
      try {
          var path = grunt.config.get('clean')[pathCfg];
          fs.emptyDirSync(path.toString());
          grunt.log.ok('Done');
      } catch (e) {
          grunt.fail.fatal(e);
      }
  });
};
