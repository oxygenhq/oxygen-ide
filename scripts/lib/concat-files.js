var fs = require('fs');
var path = require('path');

// Concatenates `srcFiles` (in order) and writes the result to every path in `destFiles`.
function concatFiles(srcFiles, destFiles) {
    var cwd = process.cwd();
    var bundle = Buffer.concat(srcFiles.map(function(script) {
        return fs.readFileSync(path.join(cwd, script));
    }));
    for (var i = 0; i < destFiles.length; i++) {
        fs.writeFileSync(path.join(cwd, destFiles[i]), bundle);
    }
    return bundle.length;
}

module.exports = concatFiles;
