var path = require('path');
var fs = require('fs');
var modclean = require('modclean');

// Runs modclean (dry-run) against `<appDir>/node_modules` and returns a glob exclude-pattern
// list ('!path' / '!path/**') for every unneeded file/dir it finds, so callers can fold the
// result into a copy step's include/exclude pattern list.
function moduleCleanup(appDir) {
    var nodeModulesDir = path.join(appDir, 'node_modules');

    return new Promise(function(resolve, reject) {
        new modclean.ModClean({
            cwd: nodeModulesDir,
            patterns: ['default:safe'],
            additionalPatterns: [
                'doc', 'docs', 'documentation',
                'LICENSE.*', 'LICENSE',
                'coverage',
                '*.txt',
                'gruntfile.js',
                'quick-test.js',
                '*.c', '*.cpp', '*.cc', '*.h',
                '*.d.ts', '*.d.ts.map',
                'yarn.lock', 'package-lock.json',
                '*.html', '*.htm', '*.png', '*.map'],
            test: true
        }, function(err, results) {
            if (err) {
                reject(err);
                return;
            }

            var patterns = [];
            for (var i = 0; i < results.length; i++) {
                var file = results[i];
                if (!file) {
                    continue;
                }
                var isDir = fs.statSync(path.join(nodeModulesDir, file)).isDirectory();
                patterns.push(isDir ? '!' + file + '/**' : '!' + file);
            }
            resolve(patterns);
        });
    });
}

module.exports = moduleCleanup;
