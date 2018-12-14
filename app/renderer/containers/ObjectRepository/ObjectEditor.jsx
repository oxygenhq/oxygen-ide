/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { PureComponent, Fragment } from 'react';

import List from '../../components/core/List';

type Props = {
  object: null | object,
};

export default class ObjectEditor extends PureComponent<Props> {
  props: Props;

  state = {
    object: null,
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      if (!nextProps.object) {
        this.setState({
          object: null,
        });
      }
      else {
        this.setState({
          object: nextProps.object,
        });
      }
    }
  }

  render() {
    const { object } = this.props;
    
    if (!object && !object.hasOwnProperty('locator')) {
      return null;
    }
    // make sure to wrap the locator property in array if it's a string
    const locators = Array.isArray(object.locator) ? object.locator : [object.locator];

    return (
        <List data={ locators } editable={ true } />
    );
  }
}