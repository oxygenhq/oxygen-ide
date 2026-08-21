var path = require('path');

var patchReportAggregator = require('./lib/patch-report-aggregator');
var clean = require('./lib/clean');
var copyLib = require('./lib/copy');
var concatFiles = require('./lib/concat-files');
var stripComments = require('./lib/strip-comments');

var rootDir = path.join(__dirname, '..');
var appDir = path.join(rootDir, 'app');

var CHROME_EXT_SRC = 'browser-extensions/chrome/src/';
var CHROME_EXT_DIST = 'browser-extensions/chrome/dist/';
var RECORDER = 'browser-extensions/recorder/';

async function main() {
    // always runs, regardless of task — matches the original Gruntfile.js, which applied
    // this patch unconditionally at module-load time.
    patchReportAggregator(appDir);

    console.log('== clean:chrome-ext ==');
    clean(path.join(rootDir, CHROME_EXT_DIST));

    console.log('== copy:chrome-ext ==');
    copyLib.copyExpand(path.join(rootDir, CHROME_EXT_SRC), ['**'], path.join(rootDir, CHROME_EXT_DIST));

    console.log('== concat-files ==');
    var bundleSize = concatFiles([
        RECORDER + 'utils.js',
        RECORDER + 'elementFinder.js',
        RECORDER + 'locatorCss.js',
        RECORDER + 'locatorBuilders.js',
        RECORDER + 'recorder.js',
        RECORDER + 'engineXpath.js'
    ], [CHROME_EXT_DIST + 'recorder.js']);
    console.log('Final file size: ' + bundleSize + ' bytes');

    console.log('== strip-comments:chrome-ext ==');
    await stripComments(CHROME_EXT_DIST + '*.js');

    console.log('Done');
}

main().catch(function(err) {
    console.error(err);
    process.exit(1);
});
