// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '../../app/package.json';
import rimraf from 'rimraf';
import electronPackage  from '../../node_modules/electron/./package.json';

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
    const electronRebuildCmd = '../node_modules/.bin/electron-rebuild --sequential --force --types prod,optional --module-dir .';

    const cmd = process.platform === 'win32'
        ? electronRebuildCmd.replace(/\//g, '\\')
        : electronRebuildCmd;

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

   // const odbcLibBindingsOriginal = path.join(nodeModulesPath, 'odbc', 'lib', 'bindings', 'napi-v4');
   // const odbcLibBindingsFinal = path.join(nodeModulesPath, 'odbc', 'lib', 'bindings', 'napi-v4');
   // fs.rmdirSync(odbcLibBindingsFinal, { recursive: true });
   // fs.renameSync(odbcLibBindingsOriginal, odbcLibBindingsFinal);
}
