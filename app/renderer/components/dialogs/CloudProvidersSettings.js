import React from 'react';
import { Form, Input, Switch, Checkbox, Select } from 'antd';
import electron from 'electron';
const { Option } = Select;

const DEFAULT_STATE = {
    providers: {},
};

// form layout settings
const formItemLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 14 },
};

type Props = {
    form: Object | undefined | null,
    visible: boolean | undefined,
    providers: Object | undefined
};

class CloudProvidersSettings extends React.PureComponent<Props> {
  
    constructor(props) {
        super(props);
        this.state = {
            ...DEFAULT_STATE,
            providers: props.providers
        };
    }

    onChangeSauceLabsUrl(value) {
        const { providers = {} } = this.state || {};
        const { sauceLabs = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
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
                ...this.state.providers,
                sauceLabs: {
                    ...sauceLabs,
                    username: value,
                }
            }
        });
    }

    onChangePerfectoMobileLocation(value) {
        const { providers = {} } = this.state || {};
        const { perfectoMobile = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                perfectoMobile: {
                    ...perfectoMobile,
                    location: value,
                }
            }
        });
    }

    onChangePerfectoMobileHost(value) {
        const { providers = {} } = this.state || {};
        const { perfectoMobile = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                perfectoMobile: {
                    ...perfectoMobile,
                    host: value,
                }
            }
        });
    }

    onChangePerfectoMobileSecurityToken(value) {
        const { providers = {} } = this.state || {};
        const { perfectoMobile = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                perfectoMobile: {
                    ...perfectoMobile,
                    securityToken: value,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
                sauceLabs: {
                    ...sauceLabs,
                    inUse: value,
                }
            }
        });
    }

    onUsePerfectoMobileChange(value) {
        const { providers = {} } = this.state || {};
        const { perfectoMobile = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                perfectoMobile: {
                    ...perfectoMobile,
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
                ...this.state.providers,
                testingBot: {
                    ...testingBot,
                    key: value,
                }
            }
        });
    }
  
    onChangeBrowserStackKey(value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    key: value,
                }
            }
        });
    }

    onChangeBrowserStackSecret(value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    secret: value,
                }
            }
        });
    }

    onChangeBrowserStackBuildName(value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    build: value,
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
                ...this.state.providers,
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
                ...this.state.providers,
                testingBot: {
                    ...testingBot,
                    inUse: value,
                }
            }
        });
    }

    onUseBrowserStackChange(value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
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
                ...this.state.providers,
                lambdaTest: {
                    ...lambdaTest,
                    inUse: value,
                }
            }
        });
    }
    
    onChangeBrowserStackDebug (value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    debug: value,
                }
            }
        });
    }

    onChangeBrowserStackNetworkLogs (value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    networkLogs: value,
                }
            }
        });
    }

    onChangeBrowserStackRecordVideo (value) {
        const { providers = {} } = this.state || {};
        const { browserStack = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                browserStack: {
                    ...browserStack,
                    recordVideo: value,
                }
            }
        });
    }    

    validateFields() {
        const { providers } = this.state;
        
        return new Promise((resolve, reject) => {
            this.props.form.validateFields((err, values) => {
                if (err) {
                    return;
                }
                resolve(providers);
            });   
        });
    }
    
    async validateFormFields() {
        const validateFieldsResults = await this.validateFields();
        
        return validateFieldsResults;
    }

    processLink = (event) => {
        if (event) {
            event.preventDefault();

            if (event.target instanceof HTMLAnchorElement) {
                const url = event.target.getAttribute('href');
                electron.shell.openExternal(url);
            } else {
                console.log('bad event.target', event.target);
            }
        }
    }
    
    render() {
        
        const {
            providers = {}
        } = this.state;

        const {
            sauceLabs = {},
            testingBot = {},
            lambdaTest = {},
            perfectoMobile = {},
            browserStack = {}
        } = providers;

        return (
            <Form>
                {/* //////////// SAUCE LABS //////////// */}
                <Form.Item label="Sauce Labs" {...formItemLayout} extra="Use Sauce Labs to run your selenium in cloud." >
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
                            <p style={{ lineHeight: '22px', paddingTop: '4px', paddingBottom: '4px' }}>
                            Type in the Hub URL that was defined in your Sauce Labs account.
                            If you are not sure what URL to use - see <a href="https://wiki.saucelabs.com/display/DOCS/Data+Center+Endpoints#DataCenterEndpoints-Endpoints" onClick={this.processLink}>here</a>.
                            </p>
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

                {/* //////////// PerfectoMobile  //////////// */}
                <Form.Item label="PerfectoMobile" {...formItemLayout} extra="Use PerfectoMobile to run your appium in cloud." >
                    <Switch onChange={ ::this.onUsePerfectoMobileChange } checked={ perfectoMobile.inUse } />
                </Form.Item>
                { perfectoMobile && perfectoMobile.inUse &&
                    <div className="cloud-providers-form-wrap cloud-providers-form-wrap-margin-bottom">
                        <Form.Item label="PerfectoMobile Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                        <Form.Item label="Remote Hub URL" {...formItemLayout} >
                            <Input
                                value={ perfectoMobile.host }
                                onChange={ (e) => ::this.onChangePerfectoMobileHost(e.target.value) }
                            />
                        </Form.Item>

                        <Form.Item label="Security Token" {...formItemLayout} >
                            <Input.Password
                                value={ perfectoMobile.securityToken }
                                onChange={ (e) => ::this.onChangePerfectoMobileSecurityToken(e.target.value) }
                            />
                        </Form.Item>

                        <Form.Item label="Location (only Web)" {...formItemLayout}>
                            <Select value={perfectoMobile.location} onChange={(value) => ::this.onChangePerfectoMobileLocation(value)}>
                                <Option value="US East">US East</Option>
                                <Option value="EU Frankfurt">EU Frankfurt</Option>
                                <Option value="AP Sydney">AP Sydney</Option>
                            </Select>
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
                            <Input.Password
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

                      
                {/* //////////// BrowserStack //////////// */} 
                <Form.Item label="BrowserStack" {...formItemLayout} extra="Use BrowserStack to run your tests in cloud." >
                    <Switch onChange={ ::this.onUseBrowserStackChange } checked={ browserStack.inUse } />
                </Form.Item>      
                {
                    browserStack && browserStack.inUse &&
                    <div className="cloud-providers-form-wrap">
                        <Form.Item label="BrowserStack Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                        <Form.Item label="Key" {...formItemLayout} >
                            <Input.Password
                                value={ browserStack.key }
                                onChange={ (e) => ::this.onChangeBrowserStackKey(e.target.value) }
                            />
                        </Form.Item>
                        <Form.Item label="Secret" {...formItemLayout} >
                            <Input.Password
                                value={ browserStack.secret }
                                onChange={ (e) => ::this.onChangeBrowserStackSecret(e.target.value) }
                            />
                        </Form.Item>
                        <Form.Item label="Build Name" {...formItemLayout} >
                            <Input
                                value={ browserStack.build }
                                onChange={ (e) => ::this.onChangeBrowserStackBuildName(e.target.value) }
                            />
                        </Form.Item>
                        <Form.Item label="Debug" {...formItemLayout} >
                            <Checkbox
                                checked={ browserStack.debug || false }
                                onChange={ (e) => ::this.onChangeBrowserStackDebug(e.target.checked) }
                            />
                        </Form.Item>
                        <Form.Item label="Network Logs" {...formItemLayout} >
                            <Checkbox
                                checked={ browserStack.networkLogs || false }
                                onChange={ (e) => ::this.onChangeBrowserStackNetworkLogs(e.target.checked) }
                            />
                        </Form.Item>
                        <Form.Item label="Record Video" {...formItemLayout} >
                            <Checkbox
                                checked={ browserStack.recordVideo || false }
                                onChange={ (e) => ::this.onChangeBrowserStackRecordVideo(e.target.checked) }
                            />
                        </Form.Item>
                    </div>
                }
            </Form>
        );
    }
}

const EnhancedForm =  Form.create()(CloudProvidersSettings);

export default class GeneralSettingsWrap extends React.PureComponent<Props> {
    render() {
        return (
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}
