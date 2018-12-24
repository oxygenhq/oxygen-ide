/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
/* eslint-disable react/no-unused-state */
import { Icon, Select, Input, message } from 'antd';
import React, { PureComponent, Fragment } from 'react';
import { type LogEntry } from '../types/LogEntry';
import ScrollContainer from './ScrollContainer';

type Props = {
    logs: Array<LogEntry>,
    category: string,
};
  
export default class LogViewer extends PureComponent<Props> {
    props: Props;

    render() {
        const { height, logs, category } = this.props;
        const lines = logs ? logs.map(log => {
            return log.message;
        }) : [];
        return (
            <div className="logs-container">
                <ScrollContainer
                    disableHorizontal
                    classes="scroller"
                >
                    {() => (
                        <div
                            className="logger-textarea"
                            style={{
                                height: height - 40,
                                minHeight: height - 39,
                            }}
                        >
                            { lines.map((line, index) => 
                                <Fragment key={ `log-${category}-line-${index}`}>
                                    <pre style={{marginBottom:'0px',whiteSpace:'pre-wrap'}}>{line}</pre>
                                </Fragment>
                            )}
                        </div>
                    )}
                </ScrollContainer>
            </div>
        );
    }
}
/*
<textarea
                                style={{
                                    width: '98%',
                                    height: height,
                                    minHeight: '98%',
                                    border: 'none',
                                    resize: 'none',
                                    outline: 'none',
                                }}
                                className="logger-textarea"
                                value={ lines.join('\n') }
                                onChange={() => {}}
                                ref={(consoleRef) => { this.consoleRef = consoleRef; }}
                            />
                            */
