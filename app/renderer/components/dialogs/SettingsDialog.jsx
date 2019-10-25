/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { PureComponent, Fragment } from 'react';
import { Form, Input, Select, Modal, InputNumber, Switch } from 'antd';
import { capitalizeFirst } from '../../helpers/general';
import FormItem from 'antd/lib/form/FormItem';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

const { Option } = Select;
const DEFAULT_STATE = {
    visible: false,
    iterations: 1,
    reopenSession: false,
    useParams: false,
    paramFilePath: null,
    paramMode: 'sequential',
};

type Props = {
  settings: Object,
  onSubmit: () => void,
  onCancel: () => void,
};

class SettingsDialog extends PureComponent<Props> {
  props: Props;

  state = {
      ...DEFAULT_STATE,
  }

  static getDerivedStateFromProps(nextProps, prevState) {
      let newState = {};
      // if the dialog was just dismissed (e.g. visible is now false)
      if (nextProps.visible == false) {
          return {
              visible: false,
              //...DEFAULT_STATE,
          };
      }
      // if the dialog was just displayed (e.g. visible is now true)
      else if (prevState.visible == false && nextProps.visible == true && nextProps.settings) {
          return {
              visible: true,
              iterations: nextProps.settings.iterations || 1,
              paramMode: nextProps.settings.paramMode || 'sequential',
              paramFilePath: nextProps.settings.paramFilePath || null,
              reopenSession: nextProps.settings.reopenSession || false,
              useParams: nextProps.settings.paramFilePath != null,
          };
      }
      // else, leave the previous state 
      return null;
  }

  onChangeIterations(value) {
      this.setState({
          iterations: value,
      });
  }

  onChangeParamMode(value) {
      this.setState({
          paramMode: value,
      });
  }

  async onBrowseFile() {
      const paths = await services.mainIpc.call('ElectronService', 'showOpenFileDialog', [[
          {name: 'Excel & CSV Files', extensions: ['xlsx', 'csv']},
          {name: 'Text Files', extensions: ['txt']},
          {name: 'All Files', extensions: ['*']}
      ]]);
      if (Array.isArray(paths) && paths.length > 0) {
          this.props.form.setFieldsValue({
              paramFilePath: paths[0]
          });
          this.setState({
              paramFilePath: paths[0],
          });
      }
  }

  onUseParamsChange(value) {
      this.setState({
          useParams: value,
          // make sure to set paramFilePath to null if use parameters switch is off
          paramFilePath: value == false ? null : this.state.paramFilePath,
      });
  }

  onReopenSessionChange(value) {
      this.setState({
          reopenSession: value,
      });
  }
  
  
  handleOk() {
      const { iterations, useParams, paramMode, paramFilePath, reopenSession } = this.state;
      this.props.form.validateFields((err, values) => {
          if (err) {
              return;
          }
          this.props.onSubmit({
              iterations: iterations,
              paramMode: paramMode,
              reopenSession: reopenSession,
              paramFilePath: useParams ? values.paramFilePath : null,
          });
      });    
  }

  render() {
      const {
          visible,
          onSubmit,
          onCancel,
      } = this.props;
      const {
          iterations,
          paramFilePath,
          paramMode,
          useParams,
          reopenSession,
      } = this.state;
      // form layout settings
      const formItemLayout = {
          labelCol: { span: 8 },
          wrapperCol: { span: 14 },
      };
      // file picker button
      const afterFilePicker = (
          <button
              style={{
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  cursor: 'pointer'
              }}
              onClick={ ::this.onBrowseFile }
          >Browse...
          </button>
      );
      const { getFieldDecorator } = this.props.form;    

      return (
          <Modal
              title={'Run Settings'}
              okText="Save &amp; Close"
              width={700}
              visible={visible}
              onOk={this.handleOk.bind(this)}
              onCancel={onCancel}
              bodyStyle={ { overflow: 'hidden', overflowY: 'hidden', height: '425px' } }
          >
              <Form>
                  <Form.Item label="Iterations" {...formItemLayout} >
                      <InputNumber
                          min={1}
                          value={ iterations }
                          onChange={ (e) => ::this.onChangeIterations(e) }
                      />
                  </Form.Item>
                  <Form.Item label="Re-Open Session" {...formItemLayout} extra="Create (re-open) a new or use an existing Selenium session on next iteration." >
                      <Switch onChange={ ::this.onReopenSessionChange } checked={ reopenSession } />
                  </Form.Item>
                  <Form.Item label="Use Parameter File" {...formItemLayout} extra="Use parameter file (CSV or Excel) to run data-driven tests." >
                      <Switch onChange={ ::this.onUseParamsChange } checked={ useParams } />
                  </Form.Item>
                  { useParams && 
              <Fragment>
                  <Form.Item label="Parameter File" {...formItemLayout} >            
                      { getFieldDecorator('paramFilePath', {
                          rules: [{
                              required: true,
                              message: 'Please choose a file!',
                          }],
                          initialValue: paramFilePath,
                      })(
                          <Input
                              addonAfter={afterFilePicker}
                              placeholder="Choose CSV or Excel file..."
                              style={{ width: '100%' }}
                              required
                              readOnly
                          />
                      )}
                  </Form.Item>
                  <Form.Item label="Read Next Row" {...formItemLayout} >
                      <Select 
                          defaultValue="sequential"
                          onChange={ (e) => ::this.onChangeParamMode(e) }
                      >
                          <Option value="random">Random</Option>
                          <Option value="sequential">Sequentially</Option>
                      </Select>
                  </Form.Item>
              </Fragment>
                  }
              </Form>
          </Modal>
      );
  }
}

export default Form.create()(SettingsDialog);