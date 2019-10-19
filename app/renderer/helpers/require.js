/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */


/**
* This function calls the original 'require' method, omitting Webpack wrapper.
*/
export default function require(moduleName) {
    const requireFunc = typeof __webpack_require__ === 'function' ? __non_webpack_require__ : require;
    return requireFunc(moduleName);
};
