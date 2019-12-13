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
import { Layout } from 'antd';
import '../css/sidebar.scss';

const { Sider } = Layout;
const MIN_SIZE = 200;

type Props = {
  align: string,
  size: number,
  visible: boolean,
  children?: Element,
  onResize: (number) => void
};

/* eslint-disable react/no-did-update-set-state */
export default class Sidebar extends React.Component<Props> {
  props: Props;

  state = {
      dragFlag: false,
      sideClass: 'restore-animation',
  };

  componentDidMount() {
      window.addEventListener('mouseup', this.onMouseUpHandler);
      window.addEventListener('mousemove', this.onAsideDragHandler);
  }

  componentDidUpdate(prevProps, prevState) {
      if (prevState.dragFlag !== this.state.dragFlag) {
          this.setState({
              sideClass: prevState.dragFlag
                  ? 'restore-animation' : 'prevent-animation',
          });
      }
  }

  componentWillUnmount() {
      window.removeEventListener('mouseup', this.onMouseUpHandler);
      window.removeEventListener('mousemove', this.onAsideDragHandler);
  }

  onAsideDragHandler = (e) => {
      if (this.props.visible && this.state.dragFlag) {
          const { align = 'left' } = this.props;
          const width = align === 'left' ? e.pageX + 3 : document.body.clientWidth - e.pageX + 3;
          if (width > MIN_SIZE) {
              this.props.onResize(width);
          } else {
              this.setState({ dragFlag: false }, this.props.onResize(MIN_SIZE));
          }
      }
  }

  onMouseUpHandler = () => {
      if (this.state.dragFlag) {
          this.setState({ dragFlag: false, sideClass: 'restore-animation' });
      }
  }

  onDragging = () => {
      this.setState({
          dragFlag: true,
          sideClass: 'prevent-animation',
      });
  }

  render() {
      const { align = 'left' } = this.props;
      return (
          <Sider
              trigger={null}
              collapsible
              collapsed={!this.props.visible}
              className={`sidebar ${this.state.sideClass}`}
              width={this.props.size}
              collapsedWidth={0}
          >
              <button
                  onMouseDown={this.onDragging}
                  className={ 'dragline ' + align }
              />
              {this.props.children}
          </Sider>
      );
  }
}
