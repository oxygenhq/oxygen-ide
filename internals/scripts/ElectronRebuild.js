// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '../../app/package.json';
import rimraf from 'rimraf';
import electronPackage  from '../../node_modules/electron/./package.json';
import nodeAbi from 'node-abi';

const nodeModulesPath =
  path.join(__dirname, '..', '..', 'app', 'node_modules');

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(nodeModulesPath)) {
    const electronRebuildCmd =
  '../node_modules/.bin/electron-rebuild --parallel --force --types prod,optional --module-dir .';

    const cmd = process.platform === 'win32'
        ? electronRebuildCmd.replace(/\//g, '\\')
        : electronRebuildCmd;

    // remove fibers for node v8 since we cannot rebuild it under electron 5+
    // FIXME: this won't be needed once WDIO is updated to v6
    rimraf.sync(path.join(nodeModulesPath, 'fibers_node_v8'));

    // cleanup everything in fibers and deasync bin folders. see relevant entry in Confluence for more details.
    rimraf.sync(path.join(nodeModulesPath, 'fibers', 'bin'));
    rimraf.sync(path.join(nodeModulesPath, 'deasync', 'bin'));

    // a workaround for using local oxygen dependency
    // remove fsevents on non OS X OSes, because electron-rebuild will fail when re-building it
    if (process.platform !== 'darwin') {
        rimraf.sync(path.join(nodeModulesPath, 'oxygen-cli', 'node_modules', 'fsevents'));
    }

    execSync(cmd, {
        cwd: path.join(__dirname, '..', '..', 'app')
    });

    // on linux, append "glibc" suffix to the Fibers binaries folder. see relevant entry in Confluence for more details.
    if (process.platform === 'linux') {
        const electronVersion = electronPackage.version;
        const abi = nodeAbi.getAbi(electronVersion, 'electron');
        const fibersOrinal = path.join(nodeModulesPath, 'fibers', 'bin', process.platform + '-' + process.arch + '-' + abi);
        const fibersFinal = path.join(nodeModulesPath, 'fibers', 'bin', process.platform + '-' + process.arch + '-' + abi + '-glibc');
        fs.renameSync(fibersOrinal, fibersFinal);
    }
}
