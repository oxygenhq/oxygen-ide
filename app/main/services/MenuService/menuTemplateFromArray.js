/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/**
 * @param  {Function} cmdHandler - function that will handle menu command
 * @param  {Array} menuItems - an array of menu items (similar to standard Electron menu item, but without click() handler)
 */
const menuTemplateFromArray = (cmdHandler, menuItems) => {
    const template = [];

    // make sure we have at least one item in the menu item list
    if (!menuItems || !menuItems.length || menuItems.length === 0) {
        return template;
    }
    for (var item of menuItems) {
    // ignore menu entries without defined command handler name
        const templateItem = {
            type: item.type || null,
            label: item.label || null,
            accelerator: item.accelerator || null,
            enabled: item.enabled || true,
            submenu: item.submenu ? menuTemplateFromArray(cmdHandler, item.submenu) : null,
            click: item.cmd ? () => cmdHandler(item.cmd) : null,
            //click() { cmdHandler(item.cmd) }
        };
        template.push(templateItem);
    }
    return template;
};

export default menuTemplateFromArray;
