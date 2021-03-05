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

const iconStyle = {
    position: 'absolute',
    fontSize: '60%',
    top: '21px',
    marginLeft: '6px'
};

const selectedIconStyle = {
    color: 'black',
    marginLeft: '6px',
    top: '28px',
    fontSize: '50%'
};

type browserIcon = {
    selected: boolean
};

export const FirefoxIcon = (props: browserIcon) => {
    const {
        selected
    } = props;

    let selectedStyles = {};

    if (selected) {
        selectedStyles = selectedIconStyle;
    }

    return (
        <span 
            style={{
                ...iconStyle,
                color: 'orange',
                ...selectedStyles
            }}
            className="fas fa-firefox"
        ></span>
    );
};

export const ChromeIcon = (props: browserIcon) => {
    const {
        selected
    } = props;

    let selectedStyles = {};

    if (selected) {
        selectedStyles = selectedIconStyle;
    }

    return (
        <span 
            style={{
                ...iconStyle,
                color: '#e8f5e9',
                ...selectedStyles
            }}
            className="fas fa-chrome"
        ></span>
    );
};