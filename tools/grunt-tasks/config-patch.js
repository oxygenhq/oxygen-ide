/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var fs = require('fs');
var os = require('os');
var path = require('path');

module.exports = function(grunt) {
    grunt.registerTask('config-patch', 'OS dependant patches for config file', function() {
        var cfg = grunt.config.get('config-patch');
        var cfgPath = path.resolve(__dirname, '..', '..', cfg.dist, 'config', 'default.json');

        if (os.platform() === 'win32') {
            updateLogPath(grunt, cfgPath, '%LOCALAPPDATA%\\Oxygen IDE\\log.txt');
        } else if (os.platform() === 'linux') {
            updateLogPath(grunt, cfgPath, '$HOME/.OxygenIDE/log.txt');
        } else if (os.platform() === 'darwin') {
            // TODO
        }
    });
};

function updateLogPath(grunt, cfgPath, path) {
    var file = fs.readFileSync(cfgPath);
    var data;
    
    try {
        data = JSON.parse(file);
    } catch (e) {
        grunt.fail.fatal(e);
    }
    
    data.logger.file.path = path;
    
    try {
        fs.writeFileSync(cfgPath, JSON.stringify(data, null, 4));
    } catch (e) {
        grunt.fail.fatal(e);
    }
}
