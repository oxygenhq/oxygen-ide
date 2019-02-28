/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { PureComponent } from 'react';
import { Form, Input, Select, Modal, message } from 'antd';
import { capitalizeFirst } from '../../helpers/general';
import FormItem from 'antd/lib/form/FormItem';

const { Option } = Select;
const DEFAULT_STATE = {
  name: '',
  type: null,
};

type Props = {
  visible: boolean,
  type?: string,
  path?: string,
  onSubmit: () => void,
  onCancel: () => void,
};

export default class ObjectCreateDialog extends PureComponent<Props> {
  props: Props;

  state = {
    ...DEFAULT_STATE,
    type: this.props.type ? this.props.type : 'object',
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

  onChangeName(e) {
    this.setState({
      name: e.target.value,
    });
  }

  handleOk() {
    const { name } = this.state;
    if (!name || name.length == 0) {
      message.error(`Object name cannot be blank!`);
      return;
    }
    this.props.onSubmit(name, this.props.type, this.props.path);
  }

  maybeParentNameIsset = () => {
    let result = '';

    if(this.props.parent && this.props.parent.name){
      result = ' to "'+this.props.parent.name+'"';
    }

    return result;
  }

  render() {

    const {
      visible,
      type,
      onSubmit,
      onCancel,
    } = this.props;

    if (!type) {
      return null;
    }
    const {
      name
    } = this.state;

    const parentName = this.maybeParentNameIsset();

    return (
      <Modal
        title={`Create New Object ${parentName}`}
        okText="Create"
        width={700}
        visible={visible}
        onOk={this.handleOk.bind(this)}
        onCancel={onCancel}
      >
        <Input
          onChange={this.onChangeName.bind(this)}
          style={{ marginBottom: 15 }}
          value={ name }
          placeholder={`Enter new Object name...`}
        />
      </Modal>
    );
  }
}
