// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '../../app/package.json';
import rimraf from 'rimraf';
import { locateElectronPrebuilt } from 'electron-rebuild/lib/src/./electron-locater';
import nodeAbi from 'node-abi';

const nodeModulesPath =
  path.join(__dirname, '..', '..', 'app', 'node_modules');

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(nodeModulesPath)) {
    const electronRebuildCmd =
  '../node_modules/.bin/electron-rebuild --parallel --force --types prod,dev,optional --module-dir .';

    const cmd = process.platform === 'win32'
        ? electronRebuildCmd.replace(/\//g, '\\')
        : electronRebuildCmd;

    // cleanup everything in fibers and deasync bin folders. see relevant entry in Confluence for more details.
    rimraf.sync(path.join(nodeModulesPath, 'fibers', 'bin'));
    rimraf.sync(path.join(nodeModulesPath, 'deasync', 'bin'));

    execSync(cmd, {
        cwd: path.join(__dirname, '..', '..', 'app')
    });
  
    // on linux, append "glibc" suffix to the Fibers binaries folder. see relevant entry in Confluence for more details.
    if (process.platform === 'linux') {
        const electronPath = locateElectronPrebuilt();
        const electronVersion = require(path.join(electronPath, 'package.json')).version;
        const abi = nodeAbi.getAbi(electronVersion, 'electron');
        const fibersOrinal = path.join(nodeModulesPath, 'fibers', 'bin', process.platform + '-' + process.arch + '-' + abi);
        const fibersFinal = path.join(nodeModulesPath, 'fibers', 'bin', process.platform + '-' + process.arch + '-' + abi + '-glibc');
        fs.renameSync(fibersOrinal, fibersFinal);
    }
}
