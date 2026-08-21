var fs = require('fs');
var os = require('os');
var path = require('path');

// OS-dependent patch for the packaged app's config file's log path.
function configPatch(distDir) {
    var cfgPath = path.resolve(__dirname, '..', '..', distDir, 'config', 'default.json');

    var logPath;
    if (os.platform() === 'win32') {
        logPath = '%LOCALAPPDATA%\\Oxygen IDE\\log.txt';
    } else if (os.platform() === 'linux') {
        logPath = '$HOME/.OxygenIDE/log.txt';
    } else {
        // darwin: TODO (matches original grunt task, which left this branch a no-op)
        return;
    }

    var data = JSON.parse(fs.readFileSync(cfgPath));
    data.logger.file.path = logPath;
    fs.writeFileSync(cfgPath, JSON.stringify(data, null, 4));
}

module.exports = configPatch;

if (require.main === module) {
    var distArg = process.argv[2] || 'dist/temp';
    configPatch(distArg);
    console.log('Done');
}
