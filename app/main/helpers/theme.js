/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { nativeTheme } from 'electron';
import appSettings from 'electron-settings';

const VALID_THEMES = ['light', 'dark', 'system'];

// Window background shown before the renderer paints (avoids a white flash in dark mode).
const DARK_BACKGROUND = '#141414';
const LIGHT_BACKGROUND = '#ffffff';

export function isValidTheme(theme) {
    return VALID_THEMES.includes(theme);
}

/**
 * Makes Electron's native chrome (scrollbars, context menus, dialogs, ...) and the renderer's
 * prefers-color-scheme follow the user's choice: 'light' | 'dark' | 'system'.
 */
export function setThemeSource(theme) {
    if (isValidTheme(theme)) {
        nativeTheme.themeSource = theme;
    }
    return nativeTheme.shouldUseDarkColors;
}

// The renderer persists its settings under appSettings.cache.settings (see ElectronService.updateCache).
export function getSavedTheme() {
    try {
        const saved = appSettings.getSync('appSettings');
        const theme = saved && saved.cache && saved.cache.settings && saved.cache.settings.theme;
        return isValidTheme(theme) ? theme : null;
    } catch (e) {
        console.warn('Unable to read the saved theme', e);
        return null;
    }
}

// Call before creating the main window so it opens in the saved theme.
export function applySavedTheme() {
    const theme = getSavedTheme();
    if (theme) {
        nativeTheme.themeSource = theme;
    }
    return nativeTheme.shouldUseDarkColors;
}

export function getWindowBackgroundColor() {
    return nativeTheme.shouldUseDarkColors ? DARK_BACKGROUND : LIGHT_BACKGROUND;
}
