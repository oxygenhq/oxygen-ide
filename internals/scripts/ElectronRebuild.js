// @flow
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';
import dependencies from '../../app/package.json';
import { rimrafSync } from 'rimraf';

const nodeModulesPath =
  path.join(__dirname, '..', '..', 'app', 'node_modules');

if (Object.keys(dependencies || {}).length > 0 && fs.existsSync(nodeModulesPath)) {
    const electronRebuildCmd =
  '../node_modules/.bin/electron-rebuild --parallel --force --types prod,optional --module-dir .';

    const cmd = process.platform === 'win32'
        ? electronRebuildCmd.replace(/\//g, '\\')
        : electronRebuildCmd;

    // a workaround for using local oxygen dependency
    // remove fsevents on non OS X OSes, because electron-rebuild will fail when re-building it
    if (process.platform !== 'darwin') {
        rimrafSync(path.join(nodeModulesPath, 'oxygen-cli', 'node_modules', 'fsevents'));
    }

    execSync(cmd, {
        cwd: path.join(__dirname, '..', '..', 'app')
    });
}
