var cp = require('child_process');
var path = require('path');

// Computes glob include-patterns for every production dependency under `appDir/node_modules`
// (instead of a blanket '**', since excludes don't play nicely with that — see module-cleanup.js),
// plus static excludes for the platform-specific mitmdump binaries that aren't needed.
function getProdDeps(appDir) {
    var prodDeps = [];

    var out;
    try {
        out = cp.execSync('npm ls --omit=dev --parseable --all', { cwd: appDir, maxBuffer: 1024 * 1024 * 50 });
    } catch (e) {
        // npm ls exits non-zero when some deps are missing/extraneous but still prints the
        // full tree to stdout — treated as normal, matching the original grunt task's comment.
        out = e.stdout || Buffer.alloc(0);
    }

    var prodDepsUnfiltered = out.toString().split(/\r?\n/);
    var si = appDir.length + 1 + 'node_modules'.length + 1;
    for (var i = 0; i < prodDepsUnfiltered.length; i++) {
        var dep = prodDepsUnfiltered[i].substring(si);
        if (dep === '' || dep.indexOf('node_modules') > 0) {
            continue;
        }
        // npm ls emits OS-native separators; scoped package paths (e.g. "@babel\core" on
        // Windows) must be normalized to "/" or glob treats the backslash as an escape char
        // and silently matches nothing, dropping the whole package from the archive.
        dep = dep.split(path.sep).join('/');
        prodDeps.push(dep + '/**');
    }

    if (process.platform === 'win32') {
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump-linux');
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump-darwin');
    } else if (process.platform === 'darwin') {
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump-linux');
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump.exe');
    } else {
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump-darwin');
        prodDeps.push('!@oxygenhq/mitmproxy-node/mitmproxy/mitmdump.exe');
    }

    return prodDeps;
}

module.exports = getProdDeps;
