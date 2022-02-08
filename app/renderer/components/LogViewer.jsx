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
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message } from 'antd';
import difference from 'lodash/difference';
import { type LogEntry } from '../types/LogEntry';
import InfiniteScroll from 'react-infinite-scroll-component';
import os from 'os';

type Props = {
    logs: Array<LogEntry>,
    category: string,
    height: number
};

export default class LogViewer extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);

        this.loggerRef = React.createRef();
        this.buttonRef = React.createRef();

        this.state = {
            refreshScroll: false,
            keyKeys: [],
            selected: false,
            copyValue: '',
            lines: []
        };
    }

    componentDidMount() {
        if (document && document.addEventListener) {
            document.addEventListener('mousedown', this.handleClickOutside);
        }

        const { logs } = this.props;        
        const lines = [];
        let newState = {};
  
        if (logs && logs.map) {
            logs.map((log) => {
                const message = log.message || 'null';
                const severity = log.severity || 'INFO';
                const messageSplit = message.split('\n');

                if (messageSplit && messageSplit.map) {
                    messageSplit.map((inputItem, i) => {
                        const item = inputItem.replace(/\t/g,'    ');

                        lines.push({
                            message: item,
                            timestamp: log.timestamp+''+i,
                            severity: severity
                        });
                    });
                } else {
                    lines.push({
                        message: log.message,
                        timestamp: log.timestamp,
                        severity: severity
                    });
                }
            });

            newState.lines = lines;
        }

        this.setState(
            newState
        );
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const diff = difference(nextProps.logs, this.props.logs); 
        const lengthDiff = !(nextProps.logs.length === this.props.logs.length);
        let newState = {};

        if ((this.props.category !== nextProps.category) || (diff && diff.length) || lengthDiff) {
            newState = {
                refreshScroll: !this.state.refreshScroll,
                keyKeys: [],
                selected: false,
                copyValue: '',
                lines: []
            };
        }

        if (lengthDiff || (diff && diff.length)) {

            const { logs } = nextProps;

            const lines = [];
  
            if (logs && logs.map) {
                logs.map((log) => {
                    const message = log.message || 'null';
                    const severity = log.severity || 'INFO';
                    const messageSplit = message.split('\n');
  
                    if (messageSplit && messageSplit.map) {
                        messageSplit.map((inputItem, i) => {
                            const item = inputItem.replace(/\t/g,'    ');

                            lines.push({
                                message: item,
                                timestamp: log.timestamp+''+i,
                                severity: severity
                            });
                        });
                    } else {
                        lines.push({
                            message: log.message,
                            timestamp: log.timestamp,
                            severity: severity
                        });
                    }
                });

                newState.lines = lines;

                setTimeout(() => {
                    const elements = document.getElementsByClassName('auto-sizer-wrapper-row');
    
                    if (elements && elements.length > 1) {
                        elements[elements.length-1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                }, 300);

            }
        }
        this.setState(
            newState
        );
    }

    componentDidUpdate() {
        const { keyKeys } = this.state;
        if (keyKeys && keyKeys.length > 1 && keyKeys[keyKeys.length - 1] === 'c') {
            this.buttonRef.current.click();
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }

    onKeyPressed = e => {
        if (e.key === 'Meta') {
            this.setState({
                keyKeys: ['Meta']
            });
        }

        if (e.key.toLowerCase() === 'a' && this.state.keyKeys[0] === 'Meta') {
            const keys = [...this.state.keyKeys];
            keys.push('a');
            this.setState({
                keyKeys: [...keys],
                selected: true
            });
        }

        if (e.key.toLowerCase() === 'c' && this.state.keyKeys[0] === 'Meta') {
            const keys = [...this.state.keyKeys];
            keys.push('c');
            this.setState({
                keyKeys: [...keys],
                copyValue: this.loggerRef.current.innerText
            });
        }
    }

    handleClickOutside = (event) => {
        if (this.state.selected && this.loggerRef && !this.loggerRef.current.contains(event.target)) {
            this.setState({
                keyKeys: [],
                selected: false
            });
        }
    }

    copyClicked = () => {

        const { lines } = this.state;

        if (!this.state.copyValue) {
            let copyValue = '';

            if (lines && lines.length && lines.length > 0) {
                lines.map((line) => {
                    copyValue+=line.message+os.EOL;
                });
            }
        
            if (copyValue) {
                this.setState({
                    keyKeys: ['Meta', 'c'],
                    copyValue: copyValue
                });
            } else {
                message.error('Nothing to copy');
            }
        }
    }

    render() {
        const { height } = this.props;
        const { selected, copyValue, lines } = this.state;

        return (
            <div className="logs-container">
                <div
                    ref={this.loggerRef}
                    className={`logger-textarea ${selected ? 'selected' : ''} `}
                    onKeyDown={this.onKeyPressed}
                    tabIndex="1"
                    style={{
                        height: height - 32,
                        minHeight: height - 32,
                    }}
                >
                    <div 
                        className="auto-sizer-wrapper"
                        style={{
                            height: height - 32,
                            minHeight: height - 32,
                            overflow: 'auto'
                        }}
                    >
                        <InfiniteScroll
                            dataLength={lines.length}
                            scrollableTarget="scrollableDiv"
                        >
                            {
                                lines.map((line, index) => {                                
                                    let color = 'rgba(0, 0, 0, 0.65)';
                        
                                    if (line && line.severity) {
                                        if (line.severity === 'ERROR') {
                                            color = '#a8071a';
                                        }
                                        
                                        if (line.severity === 'PASSED') {
                                            color = '#237804';
                                        }
                                    }
                        
                                    return (
                                        <div
                                            className="auto-sizer-wrapper-row" 
                                            style={{
                                                paddingTop: index ? '0px': '5px',
                                                color: color
                                            }} 
                                            key={index}
                                        >
                                            {line.message}
                                        </div>
                                    );
                                })
                            }
                        </InfiniteScroll>
                    </div>
                </div>
                <CopyToClipboard text={copyValue}>
                    <button
                        className="copy-btn"
                        ref={this.buttonRef}
                        onClick={this.copyClicked}
                    >
                        Copy
                    </button>
                </CopyToClipboard>
            </div>
        );
    }
}
