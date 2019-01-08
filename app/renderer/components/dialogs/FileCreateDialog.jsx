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
  ext: null,
  type: null,
};
const DEFAULT_EXT = '.js';

type Props = {
  visible: boolean,
  type?: string,
  path?: string,
  onSubmit: () => void,
  onCancel: () => void,
};

export default class FileCreateDialog extends PureComponent<Props> {
  props: Props;

  state = {
    ...DEFAULT_STATE,
    type: this.props.type ? this.props.type : 'file',
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
      if (nextProps.type === 'file') {
        newState.ext = DEFAULT_EXT;
      }
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

  onChangeExt(value) {
    this.setState({
      ext: value,
    });
  }

  onChangeName(e) {
    this.setState({
      name: e.target.value,
    });
  }

  handleOk() {
    const { name, ext } = this.state;
    if (!name || name.length == 0) {
      message.error(`Filename cannot be blank!`);
      return;
    }
    if (this.props.type === 'file') {
      const fullName = name + (ext || '');
      this.props.onSubmit(fullName, this.props.type, this.props.path);
    }
    else {
      this.props.onSubmit(name, this.props.type, this.props.path);
    }
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
      name,
      ext,
    } = this.state;
    const addonAfter = (type === 'file') ? 
      (
        <Select
          onChange={this.onChangeExt.bind(this)}
          value={ ext }
          style={{ width: 100 }}
        >
          <Option value=".js">.js</Option>
          <Option value=".json">.json</Option>
          <Option value=".txt">.txt</Option>
          <Option value=".csv">.csv</Option>
          <Option value=".xml">.xml</Option>
          <Option value=".yml">.yml</Option>          
        </Select>
      )
      : null;
    return (
      <Modal
        title={`Create New ${capitalizeFirst(type)}`}
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
          placeholder={`Enter new ${type} name...`}
          addonAfter={addonAfter}
        />
        <Form.Item label="Destination">
          <Input
            style={{ marginBottom: 15 }}
            value={this.props.path}
            readOnly
          />
        </Form.Item>
      </Modal>
    );
  }
}
