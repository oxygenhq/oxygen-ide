/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import fs from 'fs';
import path from 'path';
import { isJunk } from 'junk';
import ServiceBase from './ServiceBase';
import isUnixHiddenPath from '../helpers/isUnixHiddenPath';
import isWinHiddenPath from '../helpers/isWinHiddenPath';

// folders that are never searched (hidden folders such as .git are skipped separately)
const EXCLUDED_FOLDERS = ['node_modules'];
// files bigger than this are skipped - they are almost never source files and make searching slow
const MAX_FILE_SIZE = 2 * 1024 * 1024;
// the search stops after this many matches, the UI is told that the result is truncated
const MAX_MATCHES = 5000;
// how many bytes at the start of a file are checked for NUL characters to detect binary files
const BINARY_CHECK_SIZE = 8000;
// maximum length of the line preview returned for a single match
const MAX_PREVIEW_LENGTH = 300;
// how many characters of context are kept in front of a match when a long line is cut
const PREVIEW_LEAD = 40;

const CASE_INSENSITIVE_FS = process.platform === 'win32' || process.platform === 'darwin';

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isWordChar = (char) => /\w/.test(char);
const toPosix = (p) => p.split(path.sep).join('/');

/**
 * Builds the regular expression for the search options.
 * Throws an Error with a human readable message if the search text can not be used.
 */
export function buildSearchRegExp({ query, matchCase = false, wholeWord = false, useRegex = false }) {
    if (typeof query !== 'string' || query.length === 0) {
        throw new Error('Search text is empty.');
    }

    let source = useRegex ? query : escapeRegExp(query);

    if (wholeWord) {
        if (useRegex) {
            source = `\\b(?:${source})\\b`;
        } else {
            // \b only makes sense next to a word character ("@foo" has no word boundary before the "@")
            const start = isWordChar(query[0]) ? '\\b' : '';
            const end = isWordChar(query[query.length - 1]) ? '\\b' : '';
            source = `${start}${source}${end}`;
        }
    }

    const flags = matchCase ? '' : 'i';
    let regex;
    try {
        regex = new RegExp(source, flags + 'g');
    } catch (e) {
        // the engine's message is like "Invalid regular expression: /(/gi: Unterminated group", keep only the reason
        const reason = String(e.message).replace(/^Invalid regular expression: (\/.*\/[a-z]*: )?/, '');
        throw new Error(`Invalid regular expression: ${reason}`);
    }

    // a pattern that matches an empty string (e.g. "a*" or "^") would match at every position of every line
    if (new RegExp(source, flags).test('')) {
        throw new Error('The search pattern matches an empty string. Please make it more specific.');
    }

    return regex;
}

/**
 * Converts a glob (supports "**", "*" and "?") into a regular expression
 */
function globToRegExp(glob) {
    let source = '';
    for (let i = 0; i < glob.length; i++) {
        const char = glob[i];
        if (char === '*') {
            if (glob[i + 1] === '*') {
                // "**/" matches any number of folders (including none), "**" matches anything
                if (glob[i + 2] === '/') {
                    source += '(?:.*/)?';
                    i += 2;
                } else {
                    source += '.*';
                    i += 1;
                }
            } else {
                source += '[^/]*';
            }
        } else if (char === '?') {
            source += '[^/]';
        } else {
            source += escapeRegExp(char);
        }
    }
    return new RegExp(`^${source}$`, CASE_INSENSITIVE_FS ? 'i' : '');
}

/**
 * Compiles a comma separated list of globs, like "*.js, src/**, !test"
 * A pattern without a slash is matched against every part of the path (so "node_modules" or "*.min.js" work at any depth),
 * a pattern with a slash is matched against the path relative to the searched folder and every folder above the file.
 */
export function compileFilter(filterText) {
    if (typeof filterText !== 'string') {
        return null;
    }
    const patterns = filterText
        .split(',')
        .map(item => item.trim().replace(/\\/g, '/'))
        .map(item => item.replace(/^\.\//, '').replace(/^\//, ''))
        .filter(item => item.length > 0)
        .map(item => {
            const withoutTrailingSlash = item.replace(/\/+$/, '');
            return {
                regex: globToRegExp(withoutTrailingSlash),
                matchAnyPart: !withoutTrailingSlash.includes('/')
            };
        });

    if (patterns.length === 0) {
        return null;
    }

    return (relativePosixPath) => {
        const parts = relativePosixPath.split('/');
        return patterns.some(({ regex, matchAnyPart }) => {
            if (matchAnyPart) {
                return parts.some(part => regex.test(part));
            }
            for (let i = 1; i <= parts.length; i++) {
                if (regex.test(parts.slice(0, i).join('/'))) {
                    return true;
                }
            }
            return false;
        });
    };
}

/**
 * Reads a file as UTF-8 text.
 * Returns null for files that must not be touched: binary files, files that are not valid UTF-8 (writing them back would corrupt them)
 * and files that are too big. 
 */
async function readTextFile(filePath) {
    const stats = await fs.promises.stat(filePath);
    if (!stats.isFile() || stats.size > MAX_FILE_SIZE) {
        return null;
    }
    const buffer = await fs.promises.readFile(filePath);
    if (buffer.subarray(0, BINARY_CHECK_SIZE).includes(0)) {
        return null;
    }
    let text = buffer.toString('utf8');
    const hasBom = text.charCodeAt(0) === 0xFEFF;
    if (hasBom) {
        text = text.slice(1);
    }
    // converting the text back must give exactly the same bytes, otherwise the file is not (only) UTF-8
    const bytes = hasBom ? buffer.subarray(3) : buffer;
    if (!Buffer.from(text, 'utf8').equals(bytes)) {
        return null;
    }
    return { text, hasBom };
}

/**
 * Finds all matches in the text. Every line is searched separately, so a match never spans multiple lines.
 */
export function findMatchesInText(text, regex, limit = Infinity) {
    const matches = [];
    const lines = text.split(/\r\n|\r|\n/);

    for (let i = 0; i < lines.length && matches.length < limit; i++) {
        const line = lines[i];
        if (!line) {
            continue;
        }
        regex.lastIndex = 0;
        let match;
        while ((match = regex.exec(line)) !== null && matches.length < limit) {
            if (match[0].length === 0) {
                regex.lastIndex++;
                continue;
            }
            // long lines (e.g. minified code) are cut around the match
            let start = 0;
            if (line.length > MAX_PREVIEW_LENGTH) {
                start = Math.max(0, match.index - PREVIEW_LEAD);
            } else {
                // drop the indentation
                const indent = line.length - line.trimStart().length;
                start = Math.min(indent, match.index);
            }
            matches.push({
                line: i + 1,
                column: match.index + 1,
                length: match[0].length,
                preview: line.substr(start, MAX_PREVIEW_LENGTH),
                previewOffset: match.index - start
            });
        }
    }

    return matches;
}

/**
 * Expands the special patterns of a replacement string ($1, $&, $<name>, $$ ...) like String.prototype.replace does
 */
function expandReplacement(replacement, match, input) {
    return replacement.replace(/\$(\$|&|`|'|\d{1,2}|<[^>]*>)/g, (all, token) => {
        if (token === '$') {
            return '$';
        }
        if (token === '&') {
            return match[0];
        }
        if (token === '`') {
            return input.slice(0, match.index);
        }
        if (token === '\'') {
            return input.slice(match.index + match[0].length);
        }
        if (token[0] === '<') {
            const groupName = token.slice(1, -1);
            return match.groups && match.groups[groupName] !== undefined ? match.groups[groupName] : '';
        }
        const groupIndex = parseInt(token, 10);
        if (groupIndex >= 1 && groupIndex < match.length) {
            return match[groupIndex] === undefined ? '' : match[groupIndex];
        }
        // a reference to a group that does not exist is kept as it is
        return all;
    });
}

/**
 * Replaces all matches in a single line, returns the new line and the number of replacements
 */
function replaceInLine(line, regex, replacement, useRegex) {
    regex.lastIndex = 0;
    let result = '';
    let lastIndex = 0;
    let count = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
        if (match[0].length === 0) {
            regex.lastIndex++;
            continue;
        }
        result += line.slice(lastIndex, match.index);
        result += useRegex ? expandReplacement(replacement, match, line) : replacement;
        lastIndex = match.index + match[0].length;
        count++;
    }

    if (count === 0) {
        return { line, count };
    }
    return { line: result + line.slice(lastIndex), count };
}

/**
 * Replaces all matches in the text. Line endings of the text are kept as they are.
 */
export function replaceInText(text, regex, replacement, useRegex) {
    // odd items of the result are the line endings
    const parts = text.split(/(\r\n|\r|\n)/);
    let total = 0;

    for (let i = 0; i < parts.length; i += 2) {
        if (!parts[i]) {
            continue;
        }
        const { line, count } = replaceInLine(parts[i], regex, replacement, useRegex);
        if (count > 0) {
            parts[i] = line;
            total += count;
        }
    }

    return { text: parts.join(''), count: total };
}

const isInsideFolder = (folder, filePath) => {
    const relative = path.relative(folder, filePath);
    return relative.length > 0 && !relative.startsWith('..') && !path.isAbsolute(relative);
};

const assertFolder = async (folder) => {
    if (!folder || typeof folder !== 'string') {
        throw new Error('Folder to search in is not specified.');
    }
    let stats;
    try {
        stats = await fs.promises.stat(folder);
    } catch (e) {
        throw new Error(`Folder "${folder}" does not exist.`);
    }
    if (!stats.isDirectory()) {
        throw new Error(`"${folder}" is not a folder.`);
    }
};

export default class SearchService extends ServiceBase {
    constructor(mainWindow, settings = null) {
        super(mainWindow, settings);
        // id of the last started search, used to stop the older search when a newer one has been started
        this.searchSeq = 0;
    }

    /**
     * Lists the files of the folder (and all its subfolders) that can be searched
     */
    async *walk(folder, isExcluded, isIncluded, isCancelled) {
        const stack = [folder];

        while (stack.length > 0) {
            const currentFolder = stack.pop();
            let entries;
            try {
                entries = await fs.promises.readdir(currentFolder, { withFileTypes: true });
            } catch (e) {
                // no access to the folder, ignore it
                continue;
            }
            entries.sort((a, b) => a.name.localeCompare(b.name));

            const subFolders = [];
            for (const entry of entries) {
                if (isCancelled()) {
                    return;
                }
                const { name } = entry;
                if (
                    entry.isSymbolicLink() ||
                    isJunk(name) ||
                    isUnixHiddenPath(name) ||
                    isWinHiddenPath(name)
                ) {
                    continue;
                }
                const fullPath = path.join(currentFolder, name);
                const relativePath = toPosix(path.relative(folder, fullPath));

                if (entry.isDirectory()) {
                    if (!EXCLUDED_FOLDERS.includes(name) && !(isExcluded && isExcluded(relativePath))) {
                        subFolders.push(fullPath);
                    }
                } else if (entry.isFile()) {
                    if (isExcluded && isExcluded(relativePath)) {
                        continue;
                    }
                    if (isIncluded && !isIncluded(relativePath)) {
                        continue;
                    }
                    yield { fullPath, relativePath };
                }
            }
            // folders are visited in alphabetical order
            for (let i = subFolders.length - 1; i >= 0; i--) {
                stack.push(subFolders[i]);
            }
        }
    }

    /**
     * Searches for the text in all files of the folder.
     * @param {Object} options - { folder, query, matchCase, wholeWord, useRegex, include, exclude }
     */
    async findInFiles(options = {}) {
        const searchId = ++this.searchSeq;
        const isCancelled = () => searchId !== this.searchSeq;

        const { folder } = options;
        await assertFolder(folder);
        const regex = buildSearchRegExp(options);
        const isIncluded = compileFilter(options.include);
        const isExcluded = compileFilter(options.exclude);

        const files = [];
        let totalMatches = 0;
        let skippedFiles = 0;
        let truncated = false;

        for await (const file of this.walk(folder, isExcluded, isIncluded, isCancelled)) {
            if (isCancelled()) {
                return { cancelled: true };
            }
            let content;
            try {
                content = await readTextFile(file.fullPath);
            } catch (e) {
                content = null;
            }
            if (!content) {
                skippedFiles++;
                continue;
            }

            const matches = findMatchesInText(content.text, regex, MAX_MATCHES - totalMatches);
            if (matches.length > 0) {
                files.push({
                    path: file.fullPath,
                    relativePath: file.relativePath,
                    matches
                });
                totalMatches += matches.length;
            }
            if (totalMatches >= MAX_MATCHES) {
                truncated = true;
                break;
            }
        }

        if (isCancelled()) {
            return { cancelled: true };
        }

        return {
            cancelled: false,
            files,
            totalMatches,
            totalFiles: files.length,
            skippedFiles,
            truncated
        };
    }

    /**
     * Replaces the text in the specified files. The files are read again from the disk, so only the text that is really
     * there at the moment of the call is replaced.
     * @param {Object} options - { folder, files: [path], query, replacement, matchCase, wholeWord, useRegex }
     */
    async replaceInFiles(options = {}) {
        const { folder, files, useRegex = false } = options;
        const replacement = typeof options.replacement === 'string' ? options.replacement : '';

        await assertFolder(folder);
        if (!Array.isArray(files) || files.length === 0) {
            throw new Error('No files to replace in.');
        }
        const regex = buildSearchRegExp(options);

        const replaced = [];
        const failed = [];

        for (const filePath of files) {
            try {
                // never write outside of the searched folder
                if (typeof filePath !== 'string' || !isInsideFolder(folder, filePath)) {
                    throw new Error('The file is not inside the searched folder.');
                }
                const content = await readTextFile(filePath);
                if (!content) {
                    throw new Error('The file is binary, too big or not UTF-8 encoded.');
                }
                const { text, count } = replaceInText(content.text, regex, replacement, useRegex);
                if (count === 0) {
                    continue;
                }
                await fs.promises.writeFile(filePath, (content.hasBom ? '﻿' : '') + text, 'utf8');
                replaced.push({ path: filePath, count });
            } catch (e) {
                failed.push({ path: filePath, error: (e && e.message) || String(e) });
            }
        }

        return {
            replaced,
            failed,
            totalReplacements: replaced.reduce((sum, item) => sum + item.count, 0)
        };
    }
}
