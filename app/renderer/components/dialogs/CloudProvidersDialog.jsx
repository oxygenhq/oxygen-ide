/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { PureComponent } from 'react';
import { Form, Input, Modal, Switch, Checkbox } from 'antd';

const DEFAULT_STATE = {
    visible: false,
    providers: {},
};

type Props = {
    providers: Object,
    visible: boolean,
    form: Object,
    onSubmit: () => void,
    onCancel: () => void
};

class CloudProvidersDialog extends PureComponent<Props> {
    props: Props;

    state = {
        ...DEFAULT_STATE,
    }

    static getDerivedStateFromProps(nextProps, prevState) {
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
            };
        }
        // else, leave the previous state 
        return null;
    }

    onChangeSauceLabsUrl(value) {
        const { providers = {} } = this.state || {};
        const { sauceLabs = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
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
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
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
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
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
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
                    extendedDebugging: value,
                }
            }
        });
    }

    onChangeSauceLabsCapturePerformance(value) {
        const { providers = {} } = this.state || {};
        const { sauceLabs = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
                    capturePerformance: value,
                }
            }
        });
    }
        
    onUseSauceLabsChange(value) {
        const { providers = {} } = this.state || {};
        const { sauceLabs = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                sauceLabs: {
                    ...sauceLabs,
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
                ...providers,
                testingBot: {
                    ...testingBot,
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
                ...providers,
                testingBot: {
                    ...testingBot,
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
                ...providers,
                testingBot: {
                    ...testingBot,
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
                ...providers,
                testingBot: {
                    ...testingBot,
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
                ...providers,
                testingBot: {
                    ...testingBot,
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
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
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
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    user: value,
                }
            }
        });
    }

    onChangeLambdaBuildName (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    build: value,
                }
            }
        });
    }

    onChangeLambdaTestAccessToken (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    key: value,
                }
            }
        });
    }

    onChangeLambdaTestCaptureNetworkLogs (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    captureNetwork: value,
                }
            }
        });
    }

    onChangeLambdaTestCaptureBrowserConsole (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    captureConsole: value,
                }
            }
        });
    }

    onChangeLambdaTestTakeScreenshots (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    takeScreenshots: value,
                }
            }
        });
    }

    onChangeLambdaTestVideoRecording (value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
                    videoRecording: value,
                }
            }
        });
    }

    onUseLambdaTestChange(value) {
        const { providers = {} } = this.state || {};
        const { lambdaTest = {} } = providers;
        this.setState({
            providers: {
                ...providers,
                lambdaTest: {
                    ...lambdaTest,
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

        return (
            <Modal
                title={'Cloud Providers'}
                className="scroll-y"
                okText="Save &amp; Close"
                width={700}
                visible={visible}
                onOk={this.handleOk.bind(this)}
                onCancel={onCancel}
                bodyStyle={ { overflow: 'hidden', overflowY: 'hidden', height: '425px' } }
            >
                <Form>
                    {/* //////////// SAUCE LABS //////////// */}
                    <Form.Item label="Sauce Labs" {...formItemLayout} extra="Use Sauce Labs to run your tests in cloud." >
                        <Switch onChange={ ::this.onUseSauceLabsChange } checked={ sauceLabs.inUse } />
                    </Form.Item>
                    { sauceLabs && sauceLabs.inUse &&
                <div className="cloud-providers-form-wrap cloud-providers-form-wrap-margin-bottom">
                    <Form.Item label="Sauce Labs Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                    <Form.Item label="Remote Hub URL" {...formItemLayout} >
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
                        <Input.Password
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
                    <Form.Item label="Capture Performance" {...formItemLayout} >
                        <Checkbox
                            checked={ sauceLabs.capturePerformance || false }
                            onChange={ (e) => ::this.onChangeSauceLabsCapturePerformance(e.target.checked) }
                        />                  
                    </Form.Item>
                </div>
                    }
                    {/* //////////// LAMBDA TEST //////////// */}
                    <Form.Item label="LambdaTest" {...formItemLayout} extra="Use LambdaTest to run your tests in cloud." >
                        <Switch onChange={ ::this.onUseLambdaTestChange } checked={ lambdaTest.inUse } />
                    </Form.Item>
                    { lambdaTest && lambdaTest.inUse &&
                <div className="cloud-providers-form-wrap">
                    <Form.Item label="LambdaTest Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                    <Form.Item label="Remote Hub URL" {...formItemLayout} >
                        <Input
                            value={ lambdaTest.url }
                            onChange={ (e) => ::this.onChangeLambdaTestUrl(e.target.value) }
                        />
                    </Form.Item>
                    <Form.Item label="Username" {...formItemLayout} >
                        <Input
                            value={ lambdaTest.user }
                            onChange={ (e) => ::this.onChangeLambdaTestUsername(e.target.value) }
                        />
                    </Form.Item>
                    <Form.Item label="Access Token" {...formItemLayout} >
                        <Input.Password
                            value={ lambdaTest.key }
                            onChange={ (e) => ::this.onChangeLambdaTestAccessToken(e.target.value) }
                        />
                    </Form.Item>
                    <Form.Item label="Build Name" {...formItemLayout} >
                        <Input
                            value={ lambdaTest.build }
                            onChange={ (e) => ::this.onChangeLambdaBuildName(e.target.value) }
                        />
                    </Form.Item>
                    <Form.Item label="Capture Browser Console" {...formItemLayout} >
                        <Checkbox
                            checked={ lambdaTest.captureConsole || false }
                            onChange={ (e) => ::this.onChangeLambdaTestCaptureBrowserConsole(e.target.checked) }
                        />
                    </Form.Item>
                    <Form.Item label="Capture Network Logs" {...formItemLayout} >
                        <Checkbox
                            checked={ lambdaTest.captureNetwork || false }
                            onChange={ (e) => ::this.onChangeLambdaTestCaptureNetworkLogs(e.target.checked) }
                        />
                    </Form.Item>
                    <Form.Item label="Take Screenshots" {...formItemLayout} >
                        <Checkbox
                            checked={ lambdaTest.takeScreenshots || false }
                            onChange={ (e) => ::this.onChangeLambdaTestTakeScreenshots(e.target.checked) }
                        />
                    </Form.Item>
                    <Form.Item label="Video Recording" {...formItemLayout} >
                        <Checkbox
                            checked={ lambdaTest.videoRecording || false }
                            onChange={ (e) => ::this.onChangeLambdaTestVideoRecording(e.target.checked) }
                        />
                    </Form.Item>
                </div>
                    }
                    {/* //////////// TESTING BOT //////////// */}
                    <Form.Item label="TestingBot" {...formItemLayout} extra="Use TestingBot to run your tests in cloud." >
                        <Switch onChange={ ::this.onUseTestingBotChange } checked={ testingBot.inUse } />
                    </Form.Item>                        
                    { testingBot && testingBot.inUse &&
                <div className="cloud-providers-form-wrap">
                    <Form.Item label="TestingBot Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                    <Form.Item label="Remote Hub URL" {...formItemLayout} >
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
                        <Input.Password
                            value={ testingBot.secret }
                            onChange={ (e) => ::this.onChangeTestingBotSecret(e.target.value) }
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