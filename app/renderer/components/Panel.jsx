/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { Component } from 'react';
import type { Element } from 'react';
import ScrollContainer from './ScrollContainer';
import '../css/panel.scss';

type Props = {
  header: string|React.Node,
  scroller?: boolean,
  scrollWrapperClass?: string,
  scrollRefresh?: boolean,
  scrollVerticalOnly?: boolean,
  children?: Element,
};

/* eslint-disable react/no-did-update-set-state */
export default class Panel extends Component<Props> {
    props: Props;

    render() {
        const { 
            header,
            scroller = false,
            scrollWrapperClass = null,
            scrollRefresh = false,
            scrollVerticalOnly = false,
            refreshScrollBottom = false,
            wrapRef
        } = this.props;

        let children = this.props.children;
        if (scroller) {
            children = renderChildrenWithScroller(this.props.children, scrollWrapperClass, scrollVerticalOnly, scrollRefresh, refreshScrollBottom);
        }

        return (
            <div 
                ref={wrapRef ? wrapRef : undefined}
                className="panel"
            >
                <div className="panel-header">
                    <span>{ header }</span>
                </div>
                <div className="panel-body">
                    { children }
                </div>
            </div>
        );
    }
}

function renderChildrenWithScroller(children, wrapperClass = null, scrollVerticalOnly = false, refreshScroll = false, refreshScrollBottom = false) {
    let classes = 'scroller';
    if (wrapperClass) {
        classes += ' ' + wrapperClass;
    }
    return (
        <ScrollContainer
          refreshScroll={ refreshScroll }
          refreshScrollBottom={ refreshScrollBottom }
          disableHorizontal={ scrollVerticalOnly }
          classes={ classes }
        >
          { () => children }
        </ScrollContainer>
    )
}
