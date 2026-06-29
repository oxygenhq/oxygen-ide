const fs = require('fs');
const path = require('path');
const {homedir} = require('os');
const {execSync} = require('child_process');
const newLineRegex = /\r?\n/;

// inlined equivalent of escape-string-regexp (ESM-only, can't be required here)
function escapeRegExp(string) {
    return string
        .replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
        .replace(/-/g, '\\x2d');
}

export function darwin() {
  const suffixes = ['/Contents/MacOS/firefox'];

  const LSREGISTER = '/System/Library/Frameworks/CoreServices.framework' +
      '/Versions/A/Frameworks/LaunchServices.framework' +
      '/Versions/A/Support/lsregister';

  const installations = [];

  try {
    execSync(
        `${LSREGISTER} -dump` +
        ' | grep -i \'Firefox\\.app\'' +
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
  } catch (e) {
    // ignore, lsregister may fail/return nothing
  }

  // Retains one per line to maintain readability.
  // clang-format off
  const home = escapeRegExp(process.env.HOME || homedir());
  const priorities = [
    {regex: new RegExp(`^${home}/Applications/.*Firefox\\.app`), weight: 50},
    {regex: /^\/Applications\/.*Firefox.app/, weight: 100},
    {regex: /^\/Volumes\/.*Firefox.app/, weight: -2},
  ];

  // clang-format on
  return sort(installations, priorities);
}

export function win32() {
  const installations: Array<string> = [];
  const suffixes = [
    `${path.sep}Mozilla Firefox${path.sep}firefox.exe`,
  ];
  const prefixes = [
    process.env.LOCALAPPDATA, process.env.PROGRAMFILES, process.env['PROGRAMFILES(X86)']
  ].filter(Boolean);

  prefixes.forEach(prefix => suffixes.forEach(suffix => {
    const firefoxPath = path.join(prefix, suffix);
    if (canAccess(firefoxPath)) {
      installations.push(firefoxPath);
    }
  }));
  return installations;
}

export function linux() {
  const installations = [];
  const candidates = ['/usr/bin/firefox', '/usr/lib/firefox/firefox', '/opt/firefox/firefox'];
  candidates.forEach(candidate => {
    if (canAccess(candidate)) {
      installations.push(candidate);
    }
  });
  return installations;
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
