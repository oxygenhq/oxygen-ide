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
import { Radio, Space, Typography } from 'antd';
import { THEME_OPTIONS, THEME_SYSTEM, isValidTheme } from '../../helpers/theme';

const { Text } = Typography;

type Props = {
    theme: string | undefined,
    onThemeChange: (theme: string) => void
};

/**
 * "Appearance" tab of the Settings dialog. Unlike the other tabs it has no form to validate:
 * the choice is applied as soon as it is made (see ThemeProvider), so "Save & Close" is not needed.
 */
export default function AppearanceSettings({ theme, onThemeChange }: Props) {
    const value = isValidTheme(theme) ? theme : THEME_SYSTEM;

    return (
        <div className="appearance-settings" style={ { padding: '8px 4px' } }>
            <div style={ { fontWeight: 600, marginBottom: 12 } }>Theme</div>
            <Radio.Group
                value={ value }
                onChange={ e => onThemeChange && onThemeChange(e.target.value) }
            >
                <Space direction="vertical" size="middle">
                    { THEME_OPTIONS.map(option => (
                        <Radio key={ option.value } value={ option.value }>
                            { option.label }
                            <div>
                                <Text type="secondary">{ option.description }</Text>
                            </div>
                        </Radio>
                    )) }
                </Space>
            </Radio.Group>
        </div>
    );
}
