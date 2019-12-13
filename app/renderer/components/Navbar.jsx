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
import { NavLink } from 'react-router-dom';
import { Icon } from 'antd';

import '../css/navbar.scss';

type Props = {};

export default class Navbar extends React.Component<Props> {
  props: Props;

  render() {
      return (
          <div className="asidenav">
              <NavLink exact activeClassName="selected" to="/">
                  <Icon type="home" />
              </NavLink>
              {/* <NavLink exact activeClassName="selected" to="/oxyide">
          <Icon type="star" />
        </NavLink> */}
              <NavLink exact activeClassName="selected" to="/counter">
                  <Icon type="star-o" />
              </NavLink>
              <NavLink exact activeClassName="selected" to="/user">
                  <Icon type="user" />
              </NavLink>
          </div>
      );
  }
}
