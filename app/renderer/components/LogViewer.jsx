/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
/* eslint-disable react/no-unused-state */
import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { message } from 'antd';
import difference from 'lodash/difference';
import { type LogEntry } from '../types/LogEntry';
import ScrollContainer from './ScrollContainer.jsx';
import { AutoSizer, Grid } from 'react-virtualized';
import 'react-virtualized/styles.css';
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
            lines: [],
            maxWidth: 1
        };
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.handleClickOutside);
        const { logs } = this.props;        
        const lines = [];
        let newState = {};
        let maxWidth = 1;
  
        if(logs && logs.map){
            logs.map((log) => {
                const message = log.message || 'null';
                const messageSplit = message.split('\n');

                if(messageSplit && messageSplit.map){
                    messageSplit.map((item, i) => {
          
                        if(
                            item &&
                            item.length &&
                            maxWidth < item.length
                        ) {
                            maxWidth = item.length;
                        }

                        lines.push({
                            message: item,
                            timestamp: log.timestamp+''+i
                        });
                    });
                } else {
                    lines.push({
                        message: log.message,
                        timestamp: log.timestamp
                    });
                }
            });

            newState.lines = lines;
            newState.maxWidth = maxWidth;
        }

        this.setState(
            newState
        );
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        const diff = difference(nextProps.logs, this.props.logs); 
        const lengthDiff = !(nextProps.logs.length === this.props.logs.length);
        let newState = {};
        let maxWidth = 1;

        if ((this.props.category !== nextProps.category) || (diff && diff.length) || lengthDiff) {
            newState = {
                refreshScroll: !this.state.refreshScroll,
                keyKeys: [],
                selected: false,
                copyValue: '',
                lines: [],
                maxWidth: 1
            };
        }

        if(lengthDiff || (diff && diff.length)){

            const { logs } = nextProps;

            const lines = [];
  
            if(logs && logs.map){
                logs.map((log) => {
                    const message = log.message || 'null';
                    const messageSplit = message.split('\n');
  
                    if(messageSplit && messageSplit.map){
                        messageSplit.map((item, i) => {
              
                            if(
                                item &&
                                item.length &&
                                maxWidth < item.length
                            ) {
                                maxWidth = item.length;
                            }

                            lines.push({
                                message: item,
                                timestamp: log.timestamp+''+i
                            });
                        });
                    } else {
                        lines.push({
                            message: log.message,
                            timestamp: log.timestamp
                        });
                    }
                });

                newState.lines = lines;
                newState.maxWidth = maxWidth;
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

          if(lines && lines.length && lines.length > 0){
              lines.map((line) => {
                  copyValue+=line.message+os.EOL;
              });
          }
      
          if(copyValue){
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
      const { refreshScroll, selected, copyValue, lines, maxWidth } = this.state;
    
      const getRowHeight = ({index}) => {
          if(index){
              return 15;
          } else {
              return 20;
          }
      };

      const cellRenderer = ({
          columnIndex,
          key,
          rowIndex,
          style,
      }) => {
          const line = lines[rowIndex];
      
          return (
              <div 
                  className="auto-sizer-wrapper-row" 
                  style={{...style, paddingTop: rowIndex ? '0px': '5px'}}
                  key={key}
              >
                  {line.message}
              </div>
          );
      };

      const columnWidth = 10+7.3*maxWidth;

      return (
          <div className="logs-container">
              <ScrollContainer
                  refreshScroll={refreshScroll}
                  classes="scroller"
              >
                  {() => (
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
                              }}
                          >
                              <AutoSizer>
                                  {({width, height}) => (
                                      <Grid
                                          className="auto-sizer-wrapper-list"
                                          height={height}
                                          rowCount={lines.length}
                                          rowHeight={getRowHeight}
                                          cellRenderer={cellRenderer}
                                          columnCount={1}
                                          columnWidth={columnWidth}
                                          width={width}
                                          scrollToRow={lines.length-1}
                                          scrollToIndex={lines.length-1}
                                      />
                                  )}
                              </AutoSizer>
                          </div>
                      </div>
                  )}
              </ScrollContainer>
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
