var fs = require('fs-extra');

// Recursively empties (creating if necessary) the given directory.
function clean(dirPath) {
    fs.emptyDirSync(dirPath.toString());
}

module.exports = clean;
