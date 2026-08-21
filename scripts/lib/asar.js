var cp = require('child_process');
var path = require('path');
var os = require('os');
var fs = require('fs-extra');

function removeEmptyDirs(src) {
    if (!fs.statSync(src).isDirectory()) {
        return;
    }

    var files = fs.readdirSync(src);
    if (files.length > 0) {
        files.forEach(function(file) {
            removeEmptyDirs(path.join(src, file));
        });
        files = fs.readdirSync(src);
    }

    if (files.length === 0) {
        fs.rmdirSync(src);
    }
}

// Packs `src` (an absolute path) into an ASAR archive at `dest`, then removes `src`.
function asarPack(src, dest, unpackGlob, unpackDir) {
    removeEmptyDirs(src);

    var asarBin = path.resolve(__dirname, '..', '..', 'node_modules', '.bin', os.platform() === 'win32' ? 'asar.cmd' : 'asar');
    var result = cp.spawnSync(asarBin,
        ['pack', src, dest, '--unpack', unpackGlob, '--unpack-dir', unpackDir],
        { shell: os.platform() === 'win32', stdio: 'inherit' });
    if (result.error) {
        throw result.error;
    }
    if (result.status !== 0) {
        throw new Error('asar pack exited with code ' + result.status);
    }

    fs.removeSync(src);
}

module.exports = asarPack;
