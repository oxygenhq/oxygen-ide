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
import { Icon, Tabs } from 'antd';
import LogViewer from '../../components/LogViewer.jsx';
import VariablesViewer from '../../components/VariablesViewer';
import { type LogEntry } from '../../types/LogEntry';
import '../../css/logger.scss';

const { TabPane } = Tabs;
const MIN_HEIGHT = 200;

type Props = {
  logs: { [string]: Array<LogEntry>},
  active: string,
  visible: boolean,
  onHide: () => void,
  setActiveLogger: (logger: string) => void,
  variables: Array | null
};

/* eslint-disable react/no-did-update-set-state */
export default class Logger extends React.PureComponent<Props> {
    props: Props;

    state = {
        dragFlag: false,
        panelHeight: MIN_HEIGHT,
        viewerHeight: MIN_HEIGHT,
    };

    componentDidMount() {
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleLoggerDrag);
        // adjust log viewer height
        this.setState({ viewerHeight: this.state.panelHeight - this.headerRef.height });
    }
    
    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleLoggerDrag);
    }

    handleMouseDown = () => {
        this.setState({ dragFlag: true });
    }

    handleMouseUp = () => {
        if (this.state.dragFlag) {
            this.setState({ dragFlag: false });
        }
    }

    handleLoggerDrag = (e) => {
        if (this.state.dragFlag) {
            const height = window.innerHeight - e.pageY;
            const panelHeight = height < MIN_HEIGHT ? MIN_HEIGHT : height;
            const viewerHeight = panelHeight - this.headerRef.height;
            // don't allow to drag logger out of the window
            this.setState({ 
                panelHeight: panelHeight,
                viewerHeight: viewerHeight,
            });
        }
    }

    handleTabChange(tabKey) {
        this.props.setActiveLogger(tabKey);
    }

    render() {
        const { panelHeight } = this.state;
        const { visible = true, logs, active, variables } = this.props;
        const activeLogs = active ? logs[active] : null;

        return (
            <div
                className="ide-logger"
                style={{
                    height: this.state.panelHeight,
                    minHeight: this.state.panelHeight - 1,
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
                    >
                        <TabPane tab="General" key="general" />
                        <TabPane tab="Selenium" key="selenium" />
                        { variables && <TabPane tab="Variables" key="variables" /> }
                    </Tabs>
                    <Icon
                        type="close"
                        className="logClose"
                        onClick={ () => this.props.onHide() }
                    />
                </div>
                { active !== 'variables' && 
                    <LogViewer logs={ activeLogs } category={ active } height={ panelHeight } />
                }
                { active === 'variables' && 
                    <VariablesViewer variables={variables} height={ panelHeight } />
                }
            </div>
        );
    }
}
