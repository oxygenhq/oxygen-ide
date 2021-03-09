/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

var fs = require('fs');

module.exports = function(grunt) {
    grunt.registerMultiTask('replace-file-content', 'Replace file content', function() {
        const fileContent = fs.readFileSync(this.data.src).toString();
        fs.writeFileSync(
            this.data.dest, 
            fileContent.replace(
                this.data['origin-text'],
                this.data['dest-text']
            )
        );

        grunt.log.ok('Done');
    });
};