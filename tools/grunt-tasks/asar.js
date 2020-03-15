/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
const cp = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');

module.exports = function(grunt) {
    grunt.registerTask('asar', 'Creates ASAR', function() {
        const cfg = grunt.config.get('asar');
        removeEmptyDirs(cfg.src);

        const child = cp.spawnSync(path.resolve(__dirname, '..', '..', 'node_modules', '.bin', os.platform() === 'win32' ? 'asar.cmd' : 'asar'), 
            [ 'pack',
                cfg.src,
                cfg.dest,
                '--unpack', cfg.unpack,
                '--unpack-dir', cfg['unpack-dir']]);
        if (child.error) {
            grunt.fail.fatal(child.error);
        }

        try {
            fs.removeSync(path.resolve(__dirname, '..', '..', cfg.src));
        } catch (e) {
            grunt.fail.fatal(e);
        }

        grunt.log.ok('Done');
    });

    function removeEmptyDirs(src) {
        if (!fs.statSync(src).isDirectory()) {
            return;
        }

        var files = fs.readdirSync(src);
        if (files.length > 0) {
            files.forEach(function(file) {
                var fullPath = path.join(src, file);
                removeEmptyDirs(fullPath);
            });
            files = fs.readdirSync(src);
        }

        if (files.length === 0) {
            fs.rmdirSync(src);
            return;
        }
    }
};
