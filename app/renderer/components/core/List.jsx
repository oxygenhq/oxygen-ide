/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow

import React, { Fragment } from 'react';
import { Button, Icon } from 'antd';
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
    object: Object,
    deleteLocator: Function,
    startEdit: Function,
    editing: boolean,
    editable?: boolean
};

export default class List extends React.PureComponent<ListProps> {
    static Container = styled(FlexColumn)(props => ({
        height: '100vh',
        flexShrink: 0,
        padding: props.floating ? 10 : 0,
    }));

    handleKeyPress(e) {
        console.log('key press', e);
    }


    deleteSingleLocator = (locator) => {
        if(this.props.object && this.props.deleteLocator){
            this.props.deleteLocator(this.props.object);
        }
    }

    startEditSingleLocator = (locator) => {
        const { object, startEdit } = this.props;

        if(object && startEdit){

            const { locator, path } = object;

            if(locator && path){
                startEdit(locator, path);
            } else {
                console.warn('no locator or path');
            }

        } else {
            console.warn('this.props', this.props);
        }
    }
    
    startAdd = () => {
        const { object, startEdit } = this.props;
        if(object && startEdit){
            
            const { path } = object;

            if(path){
                startEdit('', path);
            } else {
                console.warn('no path');
            }

        } else {
            console.warn('this.props', this.props);
        }
    }

    renderInner() {
        const { 
            data = null,
            editable = false,
            editing
        } = this.props;

        if (!data || !Array.isArray(data) || data.length === 0 || !data[0]) {
            return(
                <Fragment>
                    {
                        !editing && 
                        <div className="control-wrap">
                            <div className="control-wrap-right">
                                <Button 
                                    onClick={ this.startAdd }
                                    className="control"
                                    type="primary"
                                    shape="circle" 
                                    icon="plus" 
                                />
                            </div>
                        </div>
                    }
                    <EmptyList />
                </Fragment>
            );
        }      

        
        if (!data || !Array.isArray(data) || data.length === 1 || !data[0]) {
            return (
                <Fragment>
                    <div className="control-wrap">
                    </div>
                    <List.Container className="list list-auto-height" onKeyPress={(e) => this.handleKeyPress(e)}>
                        { data.map( (itm, index) => <ListItem key={ `itm_${index}`} data={ itm } editable={ editable } controls={
                            <div className="control-wrap-right control-wrap-right-flex">
                                <div 
                                    onClick={ () => this.startEditSingleLocator(data[0]) }
                                    className="control" 
                                >
                                    <Icon type="edit" />
                                </div>
                                <div 
                                    onClick={ () => this.deleteSingleLocator(data[0]) }
                                    className="control" 
                                >
                                    <Icon type="delete" />
                                </div>
                            </div>
                        } />) }
                    </List.Container>
                </Fragment>
            );
        }
        
        return (
            <Fragment>
                <List.Container className="list list-auto-height" onKeyPress={(e) => this.handleKeyPress(e)}>
                    { data.map( (itm, index) => 
                        <div key={ `itm_${index}`} className="item-value-wrap">
                            <ListItem  data={ itm } editable={ editable } />
                        </div>
                    ) }
                </List.Container>
            </Fragment>
        );
    }

    render(){
        return(
            <Fragment>
                { this.renderInner() }
            </Fragment>
        );
    }
}

type ListItemProps = {
    // data source - a list of items
    data?: Object,
    editable?: boolean,
    controls: Element
};
class ListItem extends React.PureComponent<ListItemProps> {
    state = {
        editing: false,
    };

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
    
    static Container = styled(FlexRow)(props => ({
    }));


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
        console.log('key press', e);
    }

    render() {
        const {
            data = '',
            editable = false,
            controls = null
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
                        // onClick={ ::this.toggleEdit } 
                    >   
                        { value || 'empty string' }
                        { controls }
                    </div>
                }
            </ListItem.Container>
        );
    }
}

const EmptyList = () => {
    return (
        <div className="no-data">
            <p>No Data</p>
        </div>
    );
};