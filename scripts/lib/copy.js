var fs = require('fs');
var path = require('path');
var glob = require('glob');
var Minimatch = require('minimatch').Minimatch;

var GLOB_MAGIC = /[*?[\]{}]/;

// Splits a mixed include/exclude glob pattern list (as used throughout the previous
// Gruntfile.js, e.g. ['foo/**', '!foo/bar/**']) into separate include/exclude arrays.
function splitPatterns(patterns) {
    var include = [];
    var exclude = [];
    for (var i = 0; i < patterns.length; i++) {
        var p = patterns[i];
        if (p.indexOf('!') === 0) {
            exclude.push(p.substring(1));
        } else {
            include.push(p);
        }
    }
    return { include: include, exclude: exclude };
}

// Resolves an include/exclude glob pattern list into a flat, de-duped list of files
// (relative to `cwd`, forward-slash separated).
//
// Two perf-critical choices here (this can run with thousands of exclude patterns —
// e.g. one per junk file modclean finds across a large node_modules tree):
//  1. Passes the whole include array to a single glob() call (glob v9+ supports pattern
//     arrays) instead of looping one call per include pattern, which would re-walk and
//     re-evaluate the full exclude list on every loop iteration.
//  2. Excludes are matched ourselves after the walk, rather than via glob's `ignore`
//     option, splitting them into a Set of exact literal paths (most modclean excludes
//     are a bare filename, no glob magic) checked in O(1), and a smaller list of actual
//     glob patterns checked via precompiled Minimatch instances — much cheaper than
//     re-parsing thousands of glob strings against every candidate file.
function expandPatterns(cwd, patterns) {
    var split = splitPatterns(patterns);
    if (split.include.length === 0) {
        return [];
    }

    var literalExcludes = new Set();
    var magicExcludes = [];
    for (var e = 0; e < split.exclude.length; e++) {
        var pattern = split.exclude[e];
        if (GLOB_MAGIC.test(pattern)) {
            magicExcludes.push(new Minimatch(pattern, { dot: true }));
        } else {
            literalExcludes.add(pattern);
        }
    }

    var matches = glob.globSync(split.include, {
        cwd: cwd,
        nodir: true,
        dot: true
    });

    var files = new Set();
    for (var i = 0; i < matches.length; i++) {
        var rel = matches[i].split(path.sep).join('/');
        if (literalExcludes.has(rel)) {
            continue;
        }
        var excluded = false;
        for (var m = 0; m < magicExcludes.length; m++) {
            if (magicExcludes[m].match(rel)) {
                excluded = true;
                break;
            }
        }
        if (!excluded) {
            files.add(rel);
        }
    }
    return Array.from(files);
}

// Copies every file matched by `patterns` (glob include/exclude list, e.g.
// ['build/**', '!build/tmp/**']) from `cwd` into `destDir`, preserving relative
// paths. Mirrors grunt-contrib-copy's `expand: true` behavior — does not preserve
// source file mode bits (neither did the original grunt-contrib-copy config here,
// since none of the copy blocks set the `mode` option; executable bits were restored
// afterwards via explicit chmod steps).
function copyExpand(cwd, patterns, destDir) {
    var files = expandPatterns(cwd, patterns);
    for (var i = 0; i < files.length; i++) {
        var srcPath = path.join(cwd, files[i]);
        var destPath = path.join(destDir, files[i]);
        fs.mkdirSync(path.dirname(destPath), { recursive: true });
        fs.copyFileSync(srcPath, destPath);
    }
    return files.length;
}

module.exports = { splitPatterns: splitPatterns, expandPatterns: expandPatterns, copyExpand: copyExpand };
