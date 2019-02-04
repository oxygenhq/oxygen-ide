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
/* eslint-disable ident */
import React, { PureComponent, Fragment } from 'react';
import _ from 'lodash';
import { type LogEntry } from '../types/LogEntry';
import ScrollContainer from './ScrollContainer';

type Props = {
    logs: Array<LogEntry>,
    category: string,
    height: number
};

export default class LogViewer extends PureComponent<Props> {
  constructor(props: Props) {
    super(props: Props);
    this.state = {
      refreshScroll: false
    };
  }

  componentWillReceiveProps(nextProps) {
    const diff = _.difference(nextProps.logs, this.props.logs);
    if (diff && diff.length) {
      this.setState({ refreshScroll: !this.state.refreshScroll });
    }
  }

  render() {
    const { height, logs, category } = this.props;
    const { refreshScroll } = this.state;
    const lines = logs ? logs.map(log => {
      return {
        message: log.message,
        timestamp: log.timestamp
      };
    }) : [];
    return (
      <div className="logs-container">
        <ScrollContainer
          refreshScroll={refreshScroll}
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
              { lines.map((line) => (
                <Fragment key={`log-${category}-line-${line.timestamp}`}>
                  <pre style={{ marginBottom: '0px', whiteSpace: 'pre-wrap' }}>{line.message}</pre>
                </Fragment>
              ))}
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
