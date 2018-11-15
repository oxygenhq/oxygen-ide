/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
var pkg = require('./package.json');
var cp = require('child_process');
var path = require('path');

module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-chmod');
    
    grunt.loadTasks('./tools/grunt-tasks');

    var defaultTasks = [];
    defaultTasks.push('clean:ide');
    defaultTasks.push('module-cleanup');
    // electron uses symlinks in OS X build and grunt-contrib-copy has a bug, hence the custom task
    defaultTasks.push('copy-files');
    // NOTE: copy:main config is automatically updated by modclean task
    defaultTasks.push('copy:main');
    if (process.platform === 'linux') {
        defaultTasks.push('copy:linux');
        // temporary fix before Grunt v0.5 https://github.com/gruntjs/grunt/issues/615
        defaultTasks.push('chmod:chromedriver');
        defaultTasks.push('chmod:geckodriver');
    } else if (process.platform === 'darwin') {
        defaultTasks.push('copy:osx');
        // temporary fix before Grunt v0.5 https://github.com/gruntjs/grunt/issues/615
        defaultTasks.push('chmod:chromedriver');
        defaultTasks.push('chmod:geckodriver');
        defaultTasks.push('chmod:oxygendarwin');
    } else if (process.platform === 'win32') {
        defaultTasks.push('copy:windows');
    }
    defaultTasks.push('rebrand');

    if (process.platform === 'linux') {
        defaultTasks.push('compress:linux');
    } else if (process.platform === 'win32') {
        defaultTasks.push('installer-win');
    } else if (process.platform === 'darwin') {
        defaultTasks.push('appdmg');
    }

    grunt.registerTask('default', defaultTasks);

    grunt.registerTask('chrome-ext', ['clean:chrome-ext', 'copy:chrome-ext', 'concat-files']);

    const OUTDIR = 'dist/temp';
    const RESOURCES = process.platform === 'darwin' ? '/Electron.app/Contents/Resources' : '/resources';
    const CHROME_EXT_SRC = 'browser-extensions/chrome/src/';
    const CHROME_EXT_DIST = 'browser-extensions/chrome/dist/';
    const RECORDER = 'browser-extensions/recorder/';
    const IE_EXT_DIST = 'browser-extensions/ie/';

    // get production dependencies. instead of using '**' we get the actual deps list
    // because ** and tons of ingores (from modclean task) don't play along nicely
    var prodDeps = [];
    try {
        var cwd = process.cwd();
        process.chdir('app');
        var out = cp.execSync('npm ls --prod=true --parseable');
        var prodDepsUnfiltered = out.toString().split(/\r?\n/);
        var si = __dirname.length + 1 + 'app'.length + 1 + 'node_modules'.length + 1;
        for (var i = 0; i < prodDepsUnfiltered.length; i++) {
            var dep = prodDepsUnfiltered[i].substring(si);
            if (dep === '' || dep.indexOf('node_modules') > 0) {
                continue;
            }
            prodDeps.push(dep + '/**');
        }
        process.chdir(cwd);
    } catch (e) {
        grunt.fail.fatal('Unable to get production dependencies list', e);
    }

    grunt.initConfig({
        rebrand: {
            name: pkg.name,
            version: pkg.version,
            dist: OUTDIR,
        },
        'config-patch': {
            dist: OUTDIR
        },
        clean: {
            ide: [OUTDIR],
            'chrome-ext': [CHROME_EXT_DIST]
        },
        'copy-files': {
            src: 'node_modules/electron/dist',
            dest: OUTDIR
        },
        'concat-files': {
            src: [RECORDER + 'utils.js',
                    RECORDER + 'elementFinder.js',
                    RECORDER + 'locatorCss.js',
                    RECORDER + 'locatorBuilders.js',
                    RECORDER + 'recorder.js',
                    RECORDER + 'engineXpath.js'],
            dest: [CHROME_EXT_DIST + 'recorder.js', IE_EXT_DIST + 'recorder.js' ]
        },
        copy: {
            main: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'app/node_modules', src: prodDeps.concat(['!fibers/src/**',
                                                                   '!oxygen-cli/dotnet/**',
                                                                   '!oxygen-cli/lib/reporters/pdf/**',
                                                                   '!oxygen-cli/lib/reporters/html/**',
                                                                   '!**/obj/**',
                                                                   '!monaco-editor/dev/**',
                                                                   '!monaco-editor/esm/**',
                                                                   '!codepage/bits/**',
                                                                   '!moment/src/**']),
                        dest: OUTDIR + RESOURCES + '/app/node_modules' 
                    },
                    { 
                        expand: true, 
                        cwd: 'app', src: ['dist/**',
                                        'renderer/img/**',
                                        'main/selenium/*.jar',
                                        'main/services/RecorderService/*.cer',
                                        'main/services/RecorderService/*.pem',
                                        'main/selenium/' + process.platform + '/**',
                                        'renderer/app.html',
                                        'main/recorder/**',
                                        'renderer/index.js',
                                        'main/main.prod.*',
                                        'main/config.json',
                                        'package.json'],
                        dest: OUTDIR + RESOURCES + '/app' 
                    }
                ]
            },
            linux: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'resources', src: ['app.png'], 
                        dest: OUTDIR + RESOURCES + '/app'
                    }
                ]
            },
            osx: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'resources', src: ['app.icns'], 
                        dest: OUTDIR + RESOURCES
                    }
                ]
            },
            windows: {
                files: [
                    { 
                        expand: true, 
                        cwd: 'browser-extensions/ie/bin/Release', src: ['IEAddon.dll'], 
                        dest: OUTDIR
                    }
                ]
            },
            'chrome-ext': {
                files: [
                    { 
                        expand: true, 
                        cwd: CHROME_EXT_SRC, src: ['**'], 
                        dest: CHROME_EXT_DIST
                    }
                ]
            }
        },
        chmod: {
            options: {
                mode: '775'
            },
            chromedriver: {
                src: [process.platform === 'linux' ? 
                        OUTDIR + RESOURCES + '/app/main/selenium/linux/chromedriver' :
                        OUTDIR + RESOURCES + '/app/main/selenium/darwin/chromedriver']
            },
            geckodriver: {
                src: [process.platform === 'linux' ? 
                        OUTDIR + RESOURCES + '/app/main/selenium/linux/geckodriver' :
                        OUTDIR + RESOURCES + '/app/main/selenium/darwin/geckodriver']
            },
            oxygendarwin: {
                src: [OUTDIR + RESOURCES + '/../MacOS/Electron']
            }
        },
        compress: {
            linux: {
                options: {
                    archive: 'dist/oxygen-' + pkg.version + '-linux-x64.zip',
                    level: 9
                },
                files: [
                    { 
                        expand: true, 
                        cwd: OUTDIR, src: ['**'], 
                        dest: 'oxygen-' + pkg.version + '-linux-x64'
                    }
                ]
            }
        },
        appdmg: {
            options: {
                title: 'Oxygen IDE ' + pkg.version,
                icon: 'resources/app.icns',
                background: 'resources/dmg-background.png',
                window: { size: { width: 627, height: 440 }},
                contents: [
                    {x: 442, y: 210, type: 'link', path: '/Applications'},
                    {x: 186, y: 210, type: 'file', path: path.join(OUTDIR, 'Oxygen.app')},
                ],
                format: 'UDBZ',
                'code-sign': {
                    'signing-identity': '',
                    identifier: ''
                }
            },
            target: {
                dest:  'dist/oxygen-' + pkg.version + '-osx-x64.dmg'
            }
        },
        'installer-win': {
            version: pkg.version,
            arch: process.arch
        }
    });
};
