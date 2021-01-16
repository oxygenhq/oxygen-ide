const fs = require('fs');
const path = require('path');
const {homedir} = require('os');
const {execSync} = require('child_process');
const escapeRegExp = require('escape-string-regexp');
const newLineRegex = /\r?\n/;

export function darwin() {
  const suffixes = ['/Contents/MacOS/Microsoft Edge'];

  const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
      '/Versions/A/Frameworks/LaunchServices.framework' +
      '/Versions/A/Support/lsregister';

  const installations = [];

  execSync(
      `${LSREGISTER} -dump` +
      ' | grep -i \'Microsoft Edge\\.app\'' +
      ' | awk \'{$1=""; print $0}\'')
      .toString()
      .split(newLineRegex)
      .forEach((inst) => {
        suffixes.forEach(suffix => {
          const execPath = path.join(inst.substring(0, inst.indexOf('.app') + 4).trim(), suffix);
          if (canAccess(execPath) && installations.indexOf(execPath) === -1) {
            installations.push(execPath);
          }
        });
      });


  // Retains one per line to maintain readability.
  // clang-format off
  const home = escapeRegExp(process.env.HOME || homedir());
  const priorities = [
    {regex: new RegExp(`^${home}/Applications/.*Microsoft Edge\\.app`), weight: 50},
    {regex: /^\/Applications\/.*Microsoft Edge.app/, weight: 100},
    {regex: /^\/Volumes\/.*Microsoft Edge.app/, weight: -2},
  ];

  // clang-format on
  return sort(installations, priorities);
}

export function win32() {
  const installations: Array<string> = [];
  const suffixes = [
    `${path.sep}Microsoft${path.sep}Edge${path.sep}Application${path.sep}msedge.exe`,
  ];
  const prefixes = [
    process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
  ].filter(Boolean);

  prefixes.forEach(prefix => suffixes.forEach(suffix => {
    const edgePath = path.join(prefix, suffix);
    if (canAccess(edgePath)) {
      installations.push(edgePath);
    }
  }));
  return installations;
}

export function linux() {
  return null;
}

function sort(installations, priorities) {
  const defaultPriority = 10;
  return installations
      // assign priorities
      .map((inst: string) => {
        for (const pair of priorities) {
          if (pair.regex.test(inst)) {
            return {path: inst, weight: pair.weight};
          }
        }
        return {path: inst, weight: defaultPriority};
      })
      // sort based on priorities
      .sort((a, b) => (b.weight - a.weight))
      // remove priority flag
      .map(pair => pair.path);
}

function canAccess(file) {
  if (!file) {
    return false;
  }

  try {
    fs.accessSync(file);
    return true;
  } catch (e) {
    return false;
  }
}