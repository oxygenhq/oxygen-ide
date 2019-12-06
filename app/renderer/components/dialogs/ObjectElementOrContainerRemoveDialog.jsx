/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { Modal } from 'antd';

const DEFAULT_STATE = {
    name: '',
    type: null,
};

type Props = {
  visible: boolean,
  type?: string,
  path?: string,
  parent: Object | undefined,
  onSubmit: () => void,
  onCancel: () => void
};

export default class ObjectElementOrContainerRemoveDialog extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);


        let name = '';
        
        if(props.parent && props.parent.name){
            name = props.parent.name;
        }
        
        this.state = {
            name: name,
            type: this.props.type ? this.props.type : 'element',
        };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        let newState = {};
        if (nextProps.visible == false) {
            return {
                ...DEFAULT_STATE,
            };
        }
        if (nextProps.type != prevState.type) {
            newState.type = nextProps.type;
        }
        if (nextProps.visible != prevState.visible) {
            newState.visible = nextProps.visible;
        }
        // see if new state is not empty
        if (newState.hasOwnProperty('type') || newState.hasOwnProperty('visible')) {
            return newState;
        }
        // or return null if no changes were made
        return null;
    }

    handleOk() {
        const { type, path } = this.props;

        this.props.onSubmit(type, path);
    }

    render() {

        const {
            visible,
            type,
            parent,
            onCancel
        } = this.props;

        if (!type) {
            return null;
        }

        let typeString = '';

        if(type === 'container'){
            typeString = 'container';
        }
        if(type === 'element'){
            typeString = 'element';
        }
        
        let parentName = '';

        if(parent && parent.name){
            parentName = parent.name;
        }


        return (
            <Modal
                title="Confirm your actions"
                okText="Delete"
                visible={visible}
                onOk={this.handleOk.bind(this)}
                onCancel={onCancel}
            >
                <p>Are you sure, you want to delete &apos;{parentName}&apos; {typeString}?</p>
            </Modal>
        );
    }
}
