/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React from 'react';
import type { Element } from 'react';
import styled from '@emotion/styled';

import FlexColumn from './core/FlexColumn';
import ScrollContainer from './ScrollContainer.jsx';
import '../css/panel.scss';

type Props = {
  header: any,
  scroller?: boolean,
  scrollWrapperClass?: string,
  scrollRefresh?: boolean,
  scrollVerticalOnly?: boolean,
  noBodyPadding?: boolean,
  children?: Element,
  afterHeader: Element,
  noBodyBorders: boolean | undefined,
  className: string | undefined
};

/* eslint-disable react/no-did-update-set-state */
export default class Panel extends React.Component<Props> {
    props: Props;

    static Container = styled(FlexColumn)(props => ({
        flex: 1,
    }));

    render() {
        const { 
            header,
            afterHeader = null,
            scroller = false,
            scrollWrapperClass = null,
            scrollRefresh = false,
            scrollVerticalOnly = false,
            noBodyPadding = false,
            noBodyBorders = false,
            className = null
        } = this.props;

        let children = this.props.children;
        if (scroller) {
            children = renderChildrenWithScroller(this.props.children, scrollWrapperClass, scrollVerticalOnly, scrollRefresh);
        }

        const panelBodyClassNames = 'panel-body' + 
            (noBodyPadding ? ' no-padding' : '') +
            (noBodyBorders ? ' no-borders' : '');

        return (
            <Panel.Container className={`panel1 ${className}`}>
                { header && 
                    <div className="panel-header">
                        <span>{ header }</span>
                    </div>
                }
                { afterHeader }
                <div className={ panelBodyClassNames }>
                    { children }
                </div>
            </Panel.Container>
        );
    }
}

function renderChildrenWithScroller(children, wrapperClass = null, scrollVerticalOnly = false, refreshScroll = false) {
    let classes = 'scroller';
    if (wrapperClass) {
        classes += ' ' + wrapperClass;
    }
    return (
        <ScrollContainer
            refreshScroll={ refreshScroll }
            disableHorizontal={ scrollVerticalOnly }
            classes={ classes }
        >
            { () => children }
        </ScrollContainer>
    );
}
