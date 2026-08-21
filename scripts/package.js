var path = require('path');
var pkg = require('../package.json');

var patchReportAggregator = require('./lib/patch-report-aggregator');
var getProdDeps = require('./lib/prod-deps');
var moduleCleanup = require('./lib/module-cleanup');
var clean = require('./lib/clean');
var copyFiles = require('./lib/copy-files');
var chmod = require('./lib/chmod');
var asarPack = require('./lib/asar');
var rebrand = require('./lib/rebrand');
var compress = require('./lib/compress');
var installerWin = require('./lib/installer-win');
var installerDmg = require('./lib/installer-dmg');
var copyLib = require('./lib/copy');

var rootDir = path.join(__dirname, '..');
var appDir = path.join(rootDir, 'app');

var OUTDIR = 'dist/temp';
var RESOURCES = process.platform === 'darwin' ? '/Electron.app/Contents/Resources' : '/resources';
var SENTRY_BROWSER_SRC = path.join(rootDir, 'app', 'node_modules', '@sentry', 'browser');
var SENTRY_BROWSER_DIST = path.join(rootDir, 'dist', 'temp', 'resources', 'app', 'node_modules', '@sentry', 'browser');

async function main() {
    // always runs, regardless of platform/target — matches the original Gruntfile.js,
    // which applied this patch unconditionally at module-load time.
    patchReportAggregator(appDir);

    var prodDeps = getProdDeps(appDir);

    console.log('== clean ==');
    clean(path.join(rootDir, OUTDIR));

    console.log('== module-cleanup ==');
    var modCleanExcludes = await moduleCleanup(appDir);
    console.log('Excluded ' + modCleanExcludes.length + ' files');

    console.log('== copy-files (electron dist) ==');
    copyFiles(path.join(rootDir, 'node_modules', 'electron', 'dist'), path.join(rootDir, OUTDIR));

    console.log('== copy:main ==');
    var nodeModulesPatterns = prodDeps.concat([
        '!oxygen-cli/build/ox_reporters/pdf/**',
        '!oxygen-cli/build/ox_reporters/html/**',
        '!**/obj/**',
        '!monaco-editor/dev/**',
        '!monaco-editor/esm/**',
        '!codepage/bits/**',
        '!moment/src/**',
        '!moment/locale/**',
        '!intl/locale-data/jsonp/**',
        '!chromedriver/**',
        '!geckodriver/**',
        '!oxygen-cli/build/ox_reporters/reporter-rp.js'
    ]).concat(modCleanExcludes);
    copyLib.copyExpand(path.join(appDir, 'node_modules'), nodeModulesPatterns, path.join(rootDir, OUTDIR + RESOURCES, 'app', 'node_modules'));

    copyLib.copyExpand(appDir, [
        'dist/**',
        'renderer/img/**',
        'main/selenium/' + process.platform + '/**',
        'renderer/app.html',
        'main/recorder/**',
        'renderer/index.js',
        'main/main.prod.*',
        'main/config.json',
        'main/services/backslash.js',
        'main/services/require.js',
        'package.json'
    ], path.join(rootDir, OUTDIR + RESOURCES, 'app'));

    copyLib.copyExpand(SENTRY_BROWSER_SRC, ['**'], SENTRY_BROWSER_DIST);

    copyLib.copyExpand(rootDir, ['package.json'], path.join(rootDir, OUTDIR + RESOURCES));

    copyLib.copyExpand(appDir, ['renderer/components/MonacoEditor/cucumber/feature.tmLanguage'], path.join(rootDir, OUTDIR + RESOURCES, 'app'));

    if (process.platform === 'linux') {
        console.log('== copy:linux ==');
        copyLib.copyExpand(path.join(rootDir, 'resources'), ['app.png'], path.join(rootDir, OUTDIR + RESOURCES, 'app'));
        copyLib.copyExpand(rootDir, ['LICENSE'], path.join(rootDir, OUTDIR));

        console.log('== chmod ==');
        chmod(path.join(rootDir, OUTDIR + RESOURCES, 'app/main/selenium/linux/**/chromedriver'), '775');
        chmod(path.join(rootDir, OUTDIR + RESOURCES, 'app/main/selenium/linux/geckodriver'), '775');
    } else if (process.platform === 'darwin') {
        console.log('== copy:osx ==');
        copyLib.copyExpand(path.join(rootDir, 'resources'), ['app.icns'], path.join(rootDir, OUTDIR + RESOURCES));

        console.log('== chmod ==');
        chmod(path.join(rootDir, OUTDIR + RESOURCES, 'app/main/selenium/darwin/**/chromedriver'), '775');
        chmod(path.join(rootDir, OUTDIR + RESOURCES, 'app/main/selenium/darwin/geckodriver'), '775');
        chmod([
            path.join(rootDir, OUTDIR + RESOURCES, '../MacOS/Electron'),
            path.join(rootDir, OUTDIR + RESOURCES, 'app/node_modules/term-size/vendor/macos/term-size')
        ], '775');
    }

    console.log('== asar ==');
    asarPack(
        path.join(rootDir, OUTDIR + RESOURCES, 'app'),
        path.join(rootDir, OUTDIR + RESOURCES, 'app.asar'),
        '*.node',
        '{main/selenium,node_modules/oxygen-cli,node_modules/canvas,node_module/pdfreader}'
    );

    console.log('== rebrand ==');
    rebrand(path.join(rootDir, OUTDIR), pkg.name, pkg.version);

    if (process.platform === 'linux') {
        console.log('== compress:linux ==');
        await compress(path.join(rootDir, OUTDIR), path.join(rootDir, 'dist', 'oxygen-' + pkg.version + '-linux-x64.zip'));
    } else if (process.platform === 'win32') {
        console.log('== installer-win ==');
        installerWin(pkg.version, process.arch);
    } else if (process.platform === 'darwin') {
        console.log('== installer-dmg ==');
        await installerDmg(pkg.version, path.join(rootDir, OUTDIR));
    }

    console.log('Done');
}

main().catch(function(err) {
    console.error(err);
    process.exit(1);
});
