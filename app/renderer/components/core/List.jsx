/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow

import React, { PureComponent } from 'react';
import { Input } from 'antd';
import styled from '@emotion/styled';

import FlexColumn from './FlexColumn';
import FlexRow from './FlexRow';

import '../../css/list.scss';

/**
 * A container dispalying its children in a column
 */

type ListProps = {
    // data source - a list of items
    data?: Array<object>,
    editable?: boolean,
};

export default class List extends PureComponent<ListProps> {
    static Container = styled(FlexColumn)(props => ({
        height: '100vh',
        flexShrink: 0,
        padding: props.floating ? 10 : 0,
    }));

    handleKeyPress(e) {
        console.log('key press', e)
    }

    
    render() {
        const { 
            data = null,
            editable = false,
        } = this.props;
        if (!data || !Array.isArray(data) || data.length == 0) {
            return <EmptyList />;
        }
        return (
            <List.Container className="list" onKeyPress={(e) => this.handleKeyPress(e)}>
                { data.map( (itm, index) => <ListItem key={ `itm_${index}`} data={ itm } editable={ editable } />) }
            </List.Container>
        );
    }
}

type ListItemProps = {
    // data source - a list of items
    data?: object,
    editable?: boolean,
};
type ListItemState = {
    // indicates if the list item is currently under editing
    editing: boolean,
};
class ListItem extends PureComponent<ListItemProps> {
    state = {
        editing: false,
    };

    static Container = styled(FlexRow)(props => ({
    }));

    componentDidMount() {
        if (this.props.editable) {
          document.addEventListener('click', ::this.handleClickOutside, true);
        }
    }
    
    componentWillUnmount() {
        if (this.props.editable) {
            document.removeEventListener('click', ::this.handleClickOutside, true);
        }
    }

    handleUpdate() {
        this.toggleEdit();
    }

    toggleEdit() {
        const { editable } = this.props;
        if (!editable) {
            return;
        }

        const editing = !this.state.editing;
        this.setState({ editing }, () => {
            if (editing) {
                this.input.focus();
            }
        });
    }

    handleClickOutside(e) {
        const { editing } = this.state;
        if (editing && this.row && this.row !== e.target && !this.row.contains(e.target)) {
            this.handleUpdate();
        }
    }

    handleKeyPress(e) {
        console.log('key press', e)
    }

    render() {
        const {
            data = '',
            editable = false,
        } = this.props;

        const { editing } = this.state;
        const value = typeof data === 'object' && data.hasOwnProperty('value') ? data.value : data; 

        return (
            <ListItem.Container 
                className="list-item" 
                ref={node => (this.row = node)}
                >

                { editable && editing ? 
                    <input
                        className="item-value-editing"
                        ref={node => (this.input = node)}
                        value={ value }
                        onPressEnter={ ::this.handleUpdate }
                    />
                    :
                    <div
                        className="item-value-wrap"
                        onClick={ ::this.toggleEdit } 
                    >
                        { value }
                    </div>
                }
            </ListItem.Container>
        )
    }
}

const EmptyList = () => {
    return (
        <div>No Data</div>
    );
}