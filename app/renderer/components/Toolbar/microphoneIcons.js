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
import { ChromeIcon, FirefoxIcon } from './browserIcons';

type Props = {
    selected: boolean,
    onClick: Function
};

function getOpacity(enabled) {
    return { opacity: (enabled ? 1 : 0.5) };
}

function getClassNameWait(selected) {
    return selected ? 'control selectable active fas fa-microphone' : 'control selectable fas fa-microphone';
}

function getClassNameNotAvailable(selected) {
    return selected ? 'control selectable not-work active fas fa-microphone-slash' : 'control selectable not-work fas fa-microphone-slash';
}

function getClassNameAvailableChrome(selected) {
    return selected ? 'control selectable active green-bg fas fa-microphone' : 'control selectable fas fa-microphone';
}

function getClassNameAvailableFirefox(selected) {
    return selected ? 'control selectable active orange-bg fas fa-microphone' : 'control selectable fas fa-microphone';
}

const waitTitle = 'Record not available yet';
const notAvailableTitle = 'Record not available';
const availableTitle = 'Record available';

export const ChromeWaitIcon = (props: Props) => {
    const {
        selected
    } = props;

    return (
        <span
            style={{ ...getOpacity(false), fontFamily: 'FontAwesome' }}
            className={getClassNameWait(selected)}
            title={ waitTitle }
        >
            <ChromeIcon selected={selected}/>
        </span>
    );
};

export const FirefoxWaitIcon = (props: Props) => {
    const {
        selected
    } = props;

    return (
        <span
            style={{ ...getOpacity(false), fontFamily: 'FontAwesome' }}
            className={getClassNameWait(selected)}
            title={ waitTitle }
        >
            <FirefoxIcon selected={selected}/>
        </span>
    );
};

export const ChromeNotAvailableIcon = (props: Props) => {
    const {
        selected,
        onClick
    } = props;

    return (
        <span
            className={getClassNameNotAvailable(selected)}
            style={{ fontFamily: 'FontAwesome' }}
            title={ notAvailableTitle }
            onClick={ onClick }
        >
            <ChromeIcon selected={selected} />
        </span>
    );
};

export const FirefoxNotAvailableIcon = (props: Props) => {
    const {
        selected,
        onClick
    } = props;

    return (
        <span
            className={getClassNameNotAvailable(selected)}
            style={{ fontFamily: 'FontAwesome' }}
            title={ notAvailableTitle }
            onClick={ onClick }
        >
            <FirefoxIcon selected={selected} />
        </span>
    );
};

export const ChromAvailableIcon = (props: Props) => {
    const {
        selected,
        onClick
    } = props;
    
    return (
        <span
            className={ getClassNameAvailableChrome(selected)  }
            style={{ fontFamily: 'FontAwesome' }}
            title={ availableTitle }
            onClick={ onClick }
        >
            <ChromeIcon selected={selected}/>
        </span>
    );
};

export const FirefoxAvailableIcon = (props: Props) => {
    const {
        selected,
        onClick
    } = props;
    
    return (
        <span
            className={ getClassNameAvailableFirefox(selected)  }
            style={{ fontFamily: 'FontAwesome' }}
            title={ availableTitle }
            onClick={ onClick }
        >
            <FirefoxIcon selected={selected}/>
        </span>
    );
};