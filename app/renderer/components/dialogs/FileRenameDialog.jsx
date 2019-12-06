/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
//@flow
import React from 'react';
import { Input, Modal } from 'antd';
import { capitalizeFirst } from '../../helpers/general';

type Props = {
  visible: boolean,
  name?: string,
  type?: string,
  path?: string,
  onSubmit: () => void,
  onCancel: () => void
};

export default class FileRenameDialog extends React.PureComponent<Props> {
    constructor(props: Props){
        super(props);
        this.state = {
            visible: this.props.visible ? this.props.visible : false,
            name: this.props.name ? this.props.name : null,
        };
    }

  static getDerivedStateFromProps(nextProps, prevState) {
      if (nextProps.visible == false) {
          return ({
              visible: false,
          });
      }
      else if (nextProps.visible != prevState.visible) {
          return({
              visible: nextProps.visible,
              name: nextProps.name ? nextProps.name : null,
          });
      }
      return null;
  }

  onChangeName(e) {
      this.setState({
          name: e.target.value,
      });
  }
  handleOk() {
      const { name } = this.state;
      const { path, type } = this.props;
      if (!name || name.length == 0) {
          return;
      }
      this.props.onSubmit(path, type, name);
  }

  render() {
      const {
          type,
          path,
          onCancel,
      } = this.props;

      if (!path) {
          return null;
      }
      const {
          name,
          visible,
      } = this.state;
      if (!type) {
          return null;
      }
    
      return (
          <Modal
              title={`Rename ${capitalizeFirst(type)}`}
              okText="Rename"
              width={700}
              visible={visible}
              onOk={this.handleOk.bind(this)}
              onCancel={onCancel}
          >
              <Input
                  onChange={this.onChangeName.bind(this)}
                  style={{ marginBottom: 15 }}
                  value={ name }
                  placeholder={`Enter ${type} name...`}
              />
          </Modal>
      );
  }
}
