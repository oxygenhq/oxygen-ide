/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { initializeScroll } from './common';

/* eslint-disable import/prefer-default-export */
export default class ScrollContainer extends Component {
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

  componentWillReceiveProps(nextProps) {
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

ScrollContainer.propTypes = {
  refreshScroll: PropTypes.bool,
  refreshScrollBottom: PropTypes.bool,
  disableVertical: PropTypes.bool,
  disableHorizontal: PropTypes.bool,
  classes: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.array,
  ]),
  style: PropTypes.object,
  children: PropTypes.func.isRequired,
};
