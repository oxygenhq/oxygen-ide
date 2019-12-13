/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { initializeScroll } from './common';

type Props = {
    refreshScroll: boolean,
    refreshScrollBottom: boolean | undefined,
    disableVertical: boolean | undefined,
    disableHorizontal: boolean | undefined,
    classes: string | array,
    style: object,
    children: Function
};

/* eslint-disable import/prefer-default-export */
export default class ScrollContainer extends React.Component<Props> {
    componentDidMount() {
        if (!this.scroller) {
            const {
                disableHorizontal, disableVertical
            } = this.props;
            this.scroller = initializeScroll(
                this.scrollWrap, disableHorizontal,
                disableVertical
            );
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (nextProps.refreshScroll !== this.props.refreshScroll && this.scroller && this.scrollWrap) {
            this.scrollWrap.scrollTop = 0;
        }

        if (nextProps.refreshScrollBottom !== this.props.refreshScrollBottom && this.scroller && this.scrollWrap){
            this.scrollWrap.scrollTop = this.scrollWrap.scrollHeight;
        }

    }

    componentWillUnmount() {
        this.scroller.destroy();
        this.scroller = null;
    }

    render() {
        let { classes } = this.props;
        if (Array.isArray(classes)) {
            classes = classes.join(' ');
        }
        return (
            <div
                className={classes}
                style={{ ...this.props.style, position: 'relative', overflow: 'hidden' }}
                ref={(wrap) => { this.scrollWrap = wrap; }}
            >
                {this.props.children()}
            </div>
        );
    }
}