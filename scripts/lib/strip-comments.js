var fs = require('fs');
var glob = require('glob');
var Terser = require('terser');

// Strips comments from every JS file matched by `globPath` (in place).
//
// NOTE: Terser's `minify()` is Promise-based in the currently installed version
// (the original grunt task called it as if synchronous, which would throw since
// fs.writeFileSync can't accept a Promise — that was dead/broken code).
async function stripComments(globPath) {
    var paths = glob.globSync(globPath);
    for (var i = 0; i < paths.length; i++) {
        var filePath = paths[i];
        console.log(filePath);
        var code = fs.readFileSync(filePath, { encoding: 'utf8' });
        var result = await Terser.minify(code, {
            mangle: false,
            compress: null,
            output: {
                comments: false,
                beautify: true,
                indent_level: 2,
                keep_numbers: true
            }
        });
        fs.writeFileSync(filePath, result.code);
    }
    return paths.length;
}

module.exports = stripComments;
