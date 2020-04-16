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
  
    constructor(props){
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

    onChangeTestObjectApiKey(value) {
        const { providers = {} } = this.state || {};
        const { testObject = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                testObject: {
                    ...testObject,
                    testobject_api_key: value,
                }
            }
        });
    }
  
    onChangeSauceLabsRegion(value) {
        const { providers = {} } = this.state || {};
        const { testObject = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                testObject: {
                    ...testObject,
                    region: value,
                }
            }
        });
    }
    
    onChangeTestObjectHost(value) {
        const { providers = {} } = this.state || {};
        const { testObject = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                testObject: {
                    ...testObject,
                    host: value,
                }
            }
        });
    }

    onChangesTestObjectUsername(value) {
        const { providers = {} } = this.state || {};
        const { testObject = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                testObject: {
                    ...testObject,
                    testObjectUsername: value,
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

    onUseTestObjectChange(value) {
        const { providers = {} } = this.state || {};
        const { testObject = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                testObject: {
                    ...testObject,
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
    

    validateFields(){
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
    
    async validateFormFields(){
        const validateFieldsResults = await this.validateFields();
        
        return validateFieldsResults;
    }

    processLink = (event) => {
        if(event){
            event.preventDefault();

            if (event.target instanceof HTMLAnchorElement) {
                const url = event.target.getAttribute('href');
                electron.shell.openExternal(url);
            } else {
                console.log('bad event.target', event.target);
            }
        }
    }
    
    render(){
        
        const {
            providers = {}
        } = this.state;

        const {
            sauceLabs = {},
            testObject = {},
            testingBot = {},
            lambdaTest = {}
        } = providers;

        return(
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

                {/* //////////// TestObject  //////////// */}
                <Form.Item label="TestObject" {...formItemLayout} extra="Use TestObject to run your appium in cloud." >
                    <Switch onChange={ ::this.onUseTestObjectChange } checked={ testObject.inUse } />
                </Form.Item>
                { testObject && testObject.inUse &&
                    <div className="cloud-providers-form-wrap cloud-providers-form-wrap-margin-bottom">
                        <Form.Item label="Testobject Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                        <Form.Item label="Remote Hub URL" {...formItemLayout} >
                            <Input
                                value={ testObject.host }
                                onChange={ (e) => ::this.onChangeTestObjectHost(e.target.value) }
                            />
                        </Form.Item>
                        <Form.Item label="Username" {...formItemLayout} >
                            <Input
                                value={ testObject.testObjectUsername }
                                onChange={ (e) => ::this.onChangesTestObjectUsername(e.target.value) }
                            />
                        </Form.Item>


                        <Form.Item label="Api key" {...formItemLayout} >
                            <Input
                                value={ testObject.testobject_api_key }
                                onChange={ (e) => ::this.onChangeTestObjectApiKey(e.target.value) }
                            />
                        </Form.Item>


                        <Form.Item label="Region" {...formItemLayout}>
                            <Select value={testObject.region} onChange={(value) => ::this.onChangeSauceLabsRegion(value)}>
                                <Option value="usWest1">US West 1</Option>
                                <Option value="eu">EU Central 1</Option>
                                <Option value="headlessUsEast">Headless US-East</Option>
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
        );
    }
}

const EnhancedForm =  Form.create()(CloudProvidersSettings);

export default class GeneralSettingsWrap extends React.PureComponent<Props> {
    render(){
        return(
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}
