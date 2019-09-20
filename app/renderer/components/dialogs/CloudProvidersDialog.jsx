/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { PureComponent, Fragment } from 'react';
import { Form, Input, Select, Modal, InputNumber, Switch, Checkbox } from 'antd';
import { capitalizeFirst } from '../../helpers/general';
import FormItem from 'antd/lib/form/FormItem';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();

const { Option } = Select;
const DEFAULT_STATE = {
  visible: false,
  providers: {},
};

type Props = {
  providers: Object,
  onSubmit: () => void,
  onCancel: () => void,
};

class CloudProvidersDialog extends PureComponent<Props> {
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
    else if (prevState.visible == false && nextProps.visible == true && nextProps.providers) {
      return {
        visible: true,
        providers: nextProps.providers || {},
      }
    }
    // else, leave the previous state 
    return null;
  }

  onChangeSauceLabsUrl(value) {
    const { providers = {} } = this.state || {};
    const { sauceLabs = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        sauceLabs: {
          ...this.state.providers.sauceLabs,
          url: value,
        }
      }
    });
  }

  onChangeSauceLabsUsername(value) {
    const { providers = {} } = this.state || {};
    const { sauceLabs = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        sauceLabs: {
          ...this.state.providers.sauceLabs,
          username: value,
        }
      }
    });
  }

  onChangeSauceLabsAccessKey(value) {
    const { providers = {} } = this.state || {};
    const { sauceLabs = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        sauceLabs: {
          ...this.state.providers.sauceLabs,
          accessKey: value,
        }
      }
    });
  }

  onChangeSauceLabsExtendedDebugging(value) {
    const { providers = {} } = this.state || {};
    const { sauceLabs = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        sauceLabs: {
          ...this.state.providers.sauceLabs,
          extendedDebugging: value,
        }
      }
    });
  }
  
  onUseSauceLabsChange(value) {
    const { providers = {} } = this.state || {};
    const { sauceLabs = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        sauceLabs: {
          ...this.state.providers.sauceLabs,
          inUse: value,
        }
      }
    });
  }

  onChangeTestingBotUrl(value) {
    const { providers = {} } = this.state || {};
    const { testingBot = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        testingBot: {
          ...this.state.providers.testingBot,
          url: value,
        }
      }
    });
  }

  onChangeTestingBotKey(value) {
    const { providers = {} } = this.state || {};
    const { testingBot = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        testingBot: {
          ...this.state.providers.testingBot,
          key: value,
        }
      }
    });
  }

  onChangeTestingBotSecret(value) {
    const { providers = {} } = this.state || {};
    const { testingBot = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        testingBot: {
          ...this.state.providers.testingBot,
          secret: value,
        }
      }
    });
  }

  onChangeTestingBotExtendedDebugging(value) {
    const { providers = {} } = this.state || {};
    const { testingBot = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        testingBot: {
          ...this.state.providers.testingBot,
          extendedDebugging: value,
        }
      }
    });
  }

  onUseTestingBotChange(value) {
    const { providers = {} } = this.state || {};
    const { testingBot = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        testingBot: {
          ...this.state.providers.testingBot,
          inUse: value,
        }
      }
    });
  }

  onChangeLambdaTestUrl(value) {
    const { providers = {} } = this.state || {};
    const { lambdaTest = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        lambdaTest: {
          ...this.state.providers.lambdaTest,
          url: value,
        }
      }
    });
  }

  onChangeLambdaTestUsername (value) {
    const { providers = {} } = this.state || {};
    const { lambdaTest = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        lambdaTest: {
          ...this.state.providers.lambdaTest,
          username: value,
        }
      }
    });
  }

  onChangeLambdaTestAccessToken (value) {
    const { providers = {} } = this.state || {};
    const { lambdaTest = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        lambdaTest: {
          ...this.state.providers.lambdaTest,
          accessToken: value,
        }
      }
    });
  }

  onUseLambdaTestChange(value) {
    const { providers = {} } = this.state || {};
    const { lambdaTest = {} } = providers;
    this.setState({
      providers: {
        ...this.state.providers,
        lambdaTest: {
          ...this.state.providers.lambdaTest,
          inUse: value,
        }
      }
    });
  }
  
  handleOk() {
    const { providers } = this.state;
    this.props.form.validateFields((err, values) => {
      if (err) {
        return;
      }
      this.props.onSubmit(providers);
    });    
  }

  render() {
    const {
      visible,
      onSubmit,
      onCancel,
    } = this.props;
    const {
      providers = {}
    } = this.state;
    const {
      sauceLabs = {},
      testingBot = {},
      lambdaTest = {}
    } = providers;
    // form layout settings
    const formItemLayout = {
      labelCol: { span: 8 },
      wrapperCol: { span: 14 },
    };
    const { getFieldDecorator } = this.props.form;    

    return (
      <Modal
        title={`Cloud Providers`}
        className="scroll-y"
        okText="Save &amp; Close"
        width={700}
        visible={visible}
        onOk={this.handleOk.bind(this)}
        onCancel={onCancel}
        bodyStyle={ { overflow: 'hidden', overflowY: 'hidden', height: '425px' } }
      >
          <Form>
            <Form.Item label="Sauce Labs" {...formItemLayout} extra="Use Sauce Labs to run your tests in cloud." >
              <Switch onChange={ ::this.onUseSauceLabsChange } checked={ sauceLabs.inUse } />
            </Form.Item>
            <Form.Item label="TestingBot" {...formItemLayout} extra="Use TestingBot to run your tests in cloud." >
              <Switch onChange={ ::this.onUseTestingBotChange } checked={ testingBot.inUse } />
            </Form.Item>
            <Form.Item label="LambdaTest" {...formItemLayout} extra="Use LambdaTest to run your tests in cloud." >
              <Switch onChange={ ::this.onUseLambdaTestChange } checked={ lambdaTest.inUse } />
            </Form.Item>
            { sauceLabs && sauceLabs.inUse &&
              <div className="cloud-providers-form-wrap cloud-providers-form-wrap-margin-bottom">
                <Form.Item label="Sauce Labs settings" {...formItemLayout}/>
                <Form.Item label="Device Cloud URL" {...formItemLayout} >
                  <Input
                    value={ sauceLabs.url }
                    onChange={ (e) => ::this.onChangeSauceLabsUrl(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Username" {...formItemLayout} >
                  <Input
                    value={ sauceLabs.username }
                    onChange={ (e) => ::this.onChangeSauceLabsUsername(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Access Key" {...formItemLayout} >
                  <Input
                    value={ sauceLabs.accessKey }
                    onChange={ (e) => ::this.onChangeSauceLabsAccessKey(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Extended Debugging" {...formItemLayout} >
                  <Checkbox
                    checked={ sauceLabs.extendedDebugging || false }
                    onChange={ (e) => ::this.onChangeSauceLabsExtendedDebugging(e.target.checked) }
                  />
                </Form.Item>
              </div>
            }
            { testingBot && testingBot.inUse &&
              <div className="cloud-providers-form-wrap">
                <Form.Item label="TestingBot settings" {...formItemLayout}/>
                <Form.Item label="Cloud URL" {...formItemLayout} >
                  <Input
                    value={ testingBot.url }
                    onChange={ (e) => ::this.onChangeTestingBotUrl(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Key" {...formItemLayout} >
                  <Input
                    value={ testingBot.key }
                    onChange={ (e) => ::this.onChangeTestingBotKey(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Secret" {...formItemLayout} >
                  <Input
                    value={ testingBot.secret }
                    onChange={ (e) => ::this.onChangeTestingBotSecret(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Extended Debugging" {...formItemLayout} >
                  <Checkbox
                    checked={ testingBot.extendedDebugging || false }
                    onChange={ (e) => ::this.onChangeTestingBotExtendedDebugging(e.target.checked) }
                  />
                </Form.Item>
              </div>
            }
            { lambdaTest && lambdaTest.inUse &&
              <div className="cloud-providers-form-wrap">
                <Form.Item label="LambdaTest settings" {...formItemLayout}/>
                <Form.Item label="Cloud URL" {...formItemLayout} >
                  <Input
                    value={ lambdaTest.url }
                    onChange={ (e) => ::this.onChangeLambdaTestUrl(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="Username" {...formItemLayout} >
                  <Input
                    value={ lambdaTest.username }
                    onChange={ (e) => ::this.onChangeLambdaTestUsername(e.target.value) }
                  />
                </Form.Item>
                <Form.Item label="AccessToken" {...formItemLayout} >
                  <Input
                    value={ lambdaTest.accessToken }
                    onChange={ (e) => ::this.onChangeLambdaTestAccessToken(e.target.value) }
                  />
                </Form.Item>
              </div>
            }
          </Form>
      </Modal>
    );
  }
}

export default Form.create()(CloudProvidersDialog);