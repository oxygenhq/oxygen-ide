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
import { Icon } from 'antd';

import '../css/navbar.scss';

type Props = {
    testRunning: boolean
};

export default class Navbar extends React.Component<Props> {
    props: Props;

    render() {
        const { testRunning } = this.props;

        return (
            <div className="asidenav">
                <Icon type="folder" className={`${testRunning ? '' : 'active'}`} />
                <Icon type="bug" className={`${testRunning ? 'active' : ''}`} />
            </div>
        );
    }
}
