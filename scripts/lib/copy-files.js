var fs = require('fs-extra');

// Recursively copies a folder, preserving symlinks (electron's OS X build uses symlinks;
// grunt-contrib-copy had a bug handling those, hence this dedicated fs-extra-based copy).
function copyFiles(src, dest) {
    fs.copySync(src, dest);
}

module.exports = copyFiles;
