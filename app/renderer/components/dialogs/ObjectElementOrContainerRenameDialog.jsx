/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { Input, Modal, message } from 'antd';

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

export default class ObjectElementOrContainerRenameDialog extends React.PureComponent<Props> {
    constructor(props: Props) {

        super(props);

        this.textInput = null;

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

    componentDidMount(){
        this.focusTextInput();
    }

    focusTextInput = () => {
        if (this.textInput && this.textInput.focus) this.textInput.focus();
    };

    setTextInputRef = element => {
        if(element){
            this.textInput = element;
            if(this.textInput && this.textInput.focus){
                this.textInput.focus();
            }
        }
    };

    onChangeName(e) {
        this.setState({
            name: e.target.value,
        });
    }

    handleOk() {
        const { type } = this.props;
        const { name } = this.state;
        if (!name || name.length == 0) {
            
            let typeString = '';

            if(type === 'container'){
                typeString = 'Container';
            }
            if(type === 'element'){
                typeString = 'Element';
            }
            
            message.error(`${typeString} name cannot be blank!`);
            return;
        }
        this.props.onSubmit(name, this.props.type, this.props.path);
    }

    maybeParentNameIsset = () => {
        let result = '';

        if(this.props.parent && this.props.parent.name){
            result = this.props.parent.name;
        }

        return result;
    }

    render() {

        const {
            visible,
            type,
            onCancel,
        } = this.props;

        if (!type) {
            return null;
        }
        const {
            name
        } = this.state;

        const parentName = this.maybeParentNameIsset();

        let typeString = '';

        if(type === 'container'){
            typeString = 'Container';
        }
        if(type === 'element'){
            typeString = 'Element';
        }

        return (
            <Modal
                title={`Reneme ${typeString} '${parentName}' `}
                okText="Reneme"
                width={700}
                visible={visible}
                onOk={this.handleOk.bind(this)}
                onCancel={onCancel}
            >
                <Input
                    ref={this.setTextInputRef}
                    onChange={this.onChangeName.bind(this)}
                    style={{ marginBottom: 15 }}
                    value={ name }
                    placeholder={`Enter new ${typeString} name...`}
                />
            </Modal>
        );
    }
}
