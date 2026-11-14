/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React from 'react';
import { connect } from 'react-redux';
import { ConfigProvider, theme as antdTheme } from 'antd';
import ServicesSingleton from '../services';
import {
    ThemeContext,
    isValidTheme,
    getSystemDarkQuery,
    systemPrefersDark,
    resolveIsDark,
    applyThemeToDocument,
    THEME_SYSTEM,
} from '../helpers/theme';

const services = ServicesSingleton();

// stable objects, so consumers of ThemeContext only re-render when the theme actually flips
const CONTEXT_VALUE_LIGHT = { isDark: false };
const CONTEXT_VALUE_DARK = { isDark: true };

type Props = {
    theme: string | undefined,
    children: React.Node
};

/**
 * Applies the user's light/dark choice to the whole renderer:
 *  - sets data-theme on <html>, which css/theme.scss keys all custom colors off;
 *  - switches antd between its default and dark algorithm (also for static message/Modal calls);
 *  - tells the main process, so native scrollbars, menus and dialogs follow the choice;
 *  - exposes { isDark } through ThemeContext (e.g. for the Monaco editor theme).
 * With 'system' it follows the OS setting live.
 */
class ThemeProvider extends React.PureComponent<Props> {
    state = {
        systemDark: systemPrefersDark(),
    };

    componentDidMount() {
        this.systemQuery = getSystemDarkQuery();
        if (this.systemQuery && this.systemQuery.addEventListener) {
            this.systemQuery.addEventListener('change', this.onSystemThemeChange);
        }
        // the OS setting may have changed between the first render and mounting
        this.onSystemThemeChange(this.systemQuery);
        this.syncRendererTheme();
        // No main-process sync here: it already applied the saved theme before the window opened (see
        // app/main/helpers/theme.js), whereas this.props.theme is still the default until the saved
        // settings are restored. Syncing now would flip the native theme to 'system' and back.
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.theme !== this.props.theme || prevState.systemDark !== this.state.systemDark) {
            this.syncRendererTheme();
        }
        if (prevProps.theme !== this.props.theme) {
            this.syncMainProcessTheme();
        }
    }

    componentWillUnmount() {
        if (this.systemQuery && this.systemQuery.removeEventListener) {
            this.systemQuery.removeEventListener('change', this.onSystemThemeChange);
        }
    }

    onSystemThemeChange = (event) => {
        if (event && typeof event.matches === 'boolean' && event.matches !== this.state.systemDark) {
            this.setState({ systemDark: event.matches });
        }
    };

    getTheme() {
        return isValidTheme(this.props.theme) ? this.props.theme : THEME_SYSTEM;
    }

    isDark() {
        return resolveIsDark(this.getTheme(), this.state.systemDark);
    }

    getAntdTheme(isDark) {
        return {
            algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        };
    }

    syncRendererTheme() {
        const isDark = this.isDark();
        applyThemeToDocument(isDark);
        // antd's static functions (message.*, Modal.confirm, ...) render outside this React tree
        ConfigProvider.config({ theme: this.getAntdTheme(isDark) });
    }

    syncMainProcessTheme() {
        try {
            const result = services.mainIpc.call('ElectronService', 'setThemeSource', [this.getTheme()]);
            if (result && result.catch) {
                result.catch(e => console.warn('Unable to sync theme with the main process', e));
            }
        } catch (e) {
            console.warn('Unable to sync theme with the main process', e);
        }
    }

    render() {
        const isDark = this.isDark();

        return (
            <ThemeContext.Provider value={ isDark ? CONTEXT_VALUE_DARK : CONTEXT_VALUE_LIGHT }>
                <ConfigProvider theme={ this.getAntdTheme(isDark) }>
                    { this.props.children }
                </ConfigProvider>
            </ThemeContext.Provider>
        );
    }
}

const mapStateToProps = (state) => ({
    theme: state.settings && state.settings.theme,
});

export default connect(mapStateToProps)(ThemeProvider);
