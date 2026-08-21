var fs = require('fs');
var path = require('path');
var glob = require('glob');

// Sets `mode` on every path matched by the given glob pattern(s).
function chmod(patterns, mode) {
    var list = Array.isArray(patterns) ? patterns : [patterns];
    var files = [];
    for (var i = 0; i < list.length; i++) {
        // glob/minimatch treat "\" as an escape char, not a separator — an absolute
        // Windows pattern built with path.join (or containing a literal "**\") must be
        // normalized to "/" or it silently matches nothing.
        var pattern = list[i].split(path.sep).join('/');
        var matches = glob.globSync(pattern, { nodir: false, dot: true });
        if (matches.length === 0) {
            // matches the original grunt-chmod task's behavior of failing the whole build
            // when a source dir/file isn't found, rather than silently producing a package
            // missing an executable bit on a required binary.
            throw new Error('chmod: source dir/file not found: ' + list[i]);
        }
        for (var j = 0; j < matches.length; j++) {
            files.push(matches[j]);
        }
    }
    for (var k = 0; k < files.length; k++) {
        fs.chmodSync(files[k], mode);
    }
    return files.length;
}

module.exports = chmod;
