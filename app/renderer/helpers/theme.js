/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';

export const THEME_LIGHT = 'light';
export const THEME_DARK = 'dark';
export const THEME_SYSTEM = 'system';

export const THEME_OPTIONS = [
    { value: THEME_LIGHT, label: 'Light', description: 'Always use the light theme.' },
    { value: THEME_DARK, label: 'Dark', description: 'Always use the dark theme.' },
    { value: THEME_SYSTEM, label: 'Same as system', description: 'Follow the light/dark setting of your operating system.' },
];

// Names of the Monaco editor themes (defined in components/MonacoEditor)
export const EDITOR_THEME_LIGHT = 'oxygen-theme';
export const EDITOR_THEME_DARK = 'oxygen-theme-dark';

const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

// Provided by ThemeProvider. isDark is true while the dark theme is applied.
export const ThemeContext = React.createContext({ isDark: false });

export function isValidTheme(theme) {
    return theme === THEME_LIGHT || theme === THEME_DARK || theme === THEME_SYSTEM;
}

// MediaQueryList for the OS-level preference (null where matchMedia is unavailable).
export function getSystemDarkQuery() {
    return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(DARK_MEDIA_QUERY)
        : null;
}

export function systemPrefersDark() {
    const query = getSystemDarkQuery();
    return !!(query && query.matches);
}

// Resolves the user's choice ('light' | 'dark' | 'system') to a concrete light/dark value.
export function resolveIsDark(theme, systemDark) {
    if (theme === THEME_DARK) {
        return true;
    }
    if (theme === THEME_LIGHT) {
        return false;
    }
    return !!systemDark;
}

// All dark-mode styling hangs off this attribute (see css/theme.scss).
export function applyThemeToDocument(isDark) {
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.setAttribute('data-theme', isDark ? THEME_DARK : THEME_LIGHT);
    }
}
