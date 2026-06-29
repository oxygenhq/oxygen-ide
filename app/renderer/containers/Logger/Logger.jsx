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
import { CloseOutlined } from '@ant-design/icons';
import { Tabs } from 'antd';
import LogViewer from '../../components/LogViewer.jsx';
import VariablesViewer from '../../components/VariablesViewer';
import ReplViewer from '../../components/ReplViewer';
import { type LogEntry } from '../../types/LogEntry';
import '../../css/logger.scss';
const MIN_HEIGHT = 200;
// reserve room above the log panel for the toolbar, tabs bar, and a usable editor area —
// without this, dragging (or a window resize leaving) the panel taller than the window
// makes the column's total content exceed the viewport, and since the ancestor is
// overflow:hidden, the toolbar at the top of the column gets clipped/pushed off-screen.
const TOP_UI_RESERVED_HEIGHT = 230;

type Props = {
  logs: { [string]: Array<LogEntry>},
  active: string,
  visible: boolean,
  onHide: () => void,
  setActiveLogger: (logger: string) => void,
  variables: Array | null,
  repl: Object | null,
  replClose: Function,
  replSend: Function
};

export default class Logger extends React.PureComponent<Props> {
    props: Props;

    state = {
        dragFlag: false,
        panelHeight: MIN_HEIGHT,
        viewerHeight: MIN_HEIGHT,
    };

    componentDidMount() {
        if (window && window.addEventListener) {
            window.addEventListener('mouseup', this.handleMouseUp);
            window.addEventListener('mousemove', this.handleLoggerDrag);
            window.addEventListener('resize', this.handleWindowResize);
        }
        // adjust log viewer height
        this.setState({ viewerHeight: this.state.panelHeight - this.headerRef.offsetHeight });
    }

    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleLoggerDrag);
        window.removeEventListener('resize', this.handleWindowResize);
    }

    getMaxPanelHeight() {
        return Math.max(MIN_HEIGHT, window.innerHeight - TOP_UI_RESERVED_HEIGHT);
    }

    handleMouseDown = () => {
        this.setState({ dragFlag: true });
    };

    handleMouseUp = () => {
        if (this.state.dragFlag) {
            this.setState({ dragFlag: false });
        }
    };

    handleWindowResize = () => {
        // re-clamp so a panel dragged tall before the window was shrunk doesn't keep
        // overflowing the (now smaller) window and clipping the toolbar
        if (this.state.panelHeight > this.getMaxPanelHeight()) {
            const panelHeight = this.getMaxPanelHeight();
            this.setState({
                panelHeight,
                viewerHeight: panelHeight - this.headerRef.offsetHeight,
            });
        }
    };

    handleLoggerDrag = (e) => {
        if (this.state.dragFlag) {
            const height = window.innerHeight - e.pageY;
            let panelHeight = height < MIN_HEIGHT ? MIN_HEIGHT : height;
            // don't allow the panel to grow past the window and push the toolbar out of view
            panelHeight = Math.min(panelHeight, this.getMaxPanelHeight());
            const viewerHeight = panelHeight - this.headerRef.offsetHeight;
            // don't allow to drag logger out of the window
            this.setState({
                panelHeight: panelHeight,
                viewerHeight: viewerHeight,
            });
        }
    };

    handleTabChange(tabKey) {
        this.props.setActiveLogger(tabKey);
    }

    render() {
        const { panelHeight, viewerHeight } = this.state;
        const {
            visible = true,
            logs,
            active,
            variables,
            repl,
            replClose,
            replSend
        } = this.props;

        const activeLogs = active ? logs[active] : null;

        return (
            <div
                className="ide-logger"
                style={{
                    height: panelHeight,
                    minHeight: panelHeight - 1,
                    display: visible ? 'block' : 'none'
                }}
            >
                <button
                    onMouseDown={ ::this.handleMouseDown }
                    className="dragline"
                />
                <div className="panel-header logger-header" ref={headerRef => { this.headerRef = headerRef; }}>
                    <Tabs
                        defaultActiveKey={ active }
                        activeKey={ active }
                        onChange={ ::this.handleTabChange }
                        className="logger-tabs"
                        items={[
                            { key: 'general', label: 'General' },
                            { key: 'selenium', label: 'WebDriver' },
                            ...(variables ? [{ key: 'variables', label: 'Variables' }] : []),
                            ...(repl && repl.active ? [{ key: 'repl', label: 'REPL' }] : []),
                        ]}
                    />
                    <CloseOutlined
                        className="logClose"
                        onClick={ () => this.props.onHide() }
                    />
                </div>
                {
                    active !== 'variables' && active !== 'repl' &&
                    <LogViewer logs={ activeLogs } category={ active } height={ viewerHeight } />
                }
                {
                    active === 'variables' &&
                    <VariablesViewer variables={variables} height={ viewerHeight } />
                }
                {
                    active === 'repl' && repl.active &&
                    <ReplViewer
                        repl={ repl }
                        height={ viewerHeight }
                        replClose={ replClose }
                        replSend={ replSend }
                    />
                }
            </div>
        );
    }
}
