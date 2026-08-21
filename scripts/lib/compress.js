var fs = require('fs');
// archiver@8 replaced the old archiver('zip', opts) factory-function API with a
// ZipArchive class (the old call signature throws "archiver is not a function").
var ZipArchive = require('archiver').ZipArchive;

// Zips the contents of directory `src` into `dest`.
function compress(src, dest) {
    return new Promise(function(resolve, reject) {
        var output = fs.createWriteStream(dest);
        var archive = new ZipArchive({ zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);

        archive.pipe(output);
        archive.directory(src, '');
        archive.finalize();
    });
}

module.exports = compress;
