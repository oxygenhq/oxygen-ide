// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '../../app/package.json';
import rimraf from 'rimraf';
import electronPackage  from '../../node_modules/electron/./package.json';
import nodeAbi from 'node-abi';

const checkMSVSVersion = () => {
    const command = 'npm config get msvs_version';
    const expect = '2019';
    const msvs_version = execSync(command).toString().trim();
    if (msvs_version !== expect) {
        throw new Error(`msvs_version should be ${expect}, now ${msvs_version}`);
    }
};

const nodeModulesPath =
  path.join(__dirname, '..', '..', 'app', 'node_modules');

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(nodeModulesPath)) {
    // canvas cannot be rebuild on electron >= 8. need to wait for canvas to be updated to use node-bindings-api instead of nan.
    // so we rebuild everything except canvas (it's not needed in IDE since it's used only for creating test screenshots)
    // also for some reason parallel rebuild fails, so we use sequential.
    const electronRebuildCmd =
  '../node_modules/.bin/electron-rebuild --sequential --force --types prod,optional --only odbc,deasync,fibers,node-expat,@serialport  --module-dir .';

    const cmd = process.platform === 'win32'
        ? electronRebuildCmd.replace(/\//g, '\\')
        : electronRebuildCmd;

    // cleanup everything in fibers and deasync bin folders. see relevant entry in Confluence for more details.
    rimraf.sync(path.join(nodeModulesPath, 'fibers', 'bin'));
    rimraf.sync(path.join(nodeModulesPath, 'deasync', 'bin'));

    // a workaround for using local oxygen dependency
    // remove fsevents on non OS X OSes, because electron-rebuild will fail when re-building it
    if (process.platform !== 'darwin') {
        rimraf.sync(path.join(nodeModulesPath, 'oxygen-cli', 'node_modules', 'fsevents'));
    }

    if (process.platform === 'win32') {
        checkMSVSVersion();
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
    
    const odbcLibBindingsOriginal = path.join(nodeModulesPath, 'odbc', 'lib', 'bindings', 'napi-v4');
    const odbcLibBindingsFinal = path.join(nodeModulesPath, 'odbc', 'lib', 'bindings', 'napi-v4');
    fs.rmdirSync(odbcLibBindingsFinal, { recursive: true });
   // fs.renameSync(odbcLibBindingsOriginal, odbcLibBindingsFinal);
}
