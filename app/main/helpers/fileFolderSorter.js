/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
export default function(a, b) {
    // if a is folder but b is a file - a comes first
    if (a.type === 'folder' && b.type === 'file') {
        return -1;  // a comes first
    }
    // if b is folder but a is a file - b comes first
    else if (a.type ==='file' && b.type === 'folder') {
        return 1;   // b comes first
    }
    else {
        return a.name.localeCompare(b.name, undefined, {sensitivity: 'base'});
    }
}
