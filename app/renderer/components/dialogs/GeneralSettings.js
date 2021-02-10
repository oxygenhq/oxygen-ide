import React, { Fragment } from 'react';
import { Form, Input, Select, InputNumber, Switch, Checkbox  } from 'antd';
const { Option } = Select;
import ServicesSingleton from '../../services';
const services = ServicesSingleton();

const DEFAULT_STATE = {
    iterations: 1,
    reopenSession: false,
    useParams: false,
    useIntellisense: true,
    paramFilePath: null,
    paramMode: 'sequential',
    useAllParameters: false
};

// form layout settings
const formItemLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 14 },
};

type Props = {
    form: Object | undefined | null,
    visible: boolean | undefined,
    settings: Object | undefined,
    projectSettings: Object | undefined
};


class GeneralSettings extends React.PureComponent<Props> {    
    constructor(props) {
        super(props);
        let useIntellisense = true;

        if (
            props.settings &&
            props.settings.useIntellisense === false
        ) {
            useIntellisense = false;
        }

        this.state = {
            ...DEFAULT_STATE,
            iterations: props.settings.iterations || 1,
            env: props.settings.env || null,
            paramMode: props.settings.paramMode || 'sequential',
            useAllParameters: props.settings.useAllParameters || false,
            paramFilePath: props.settings.paramFilePath || null,
            reopenSession: props.settings.reopenSession || false,
            useParams: props.settings.paramFilePath != null,
            useIntellisense: useIntellisense,
        };
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

    onUseParamsChange(value) {
        this.setState({
            useParams: value,
            // make sure to set paramFilePath to null if use parameters switch is off
            paramFilePath: value == false ? null : this.state.paramFilePath,
        });
    }

    onUseIntellisenseChange(value) {
        this.setState({
            useIntellisense: value,
        });
    }

    onReopenSessionChange(value) {
        this.setState({
            reopenSession: value,
        });
    }

    onChangeEnvironment(value) {
        this.setState({
            env: value,
        });
    }

    useAllParametersChange = (e) => {
        this.setState({
            useAllParameters: e.target.checked
        });
    }

    validateFields = () => {
        const { iterations, useParams, useIntellisense, paramMode, reopenSession, env, useAllParameters } = this.state;

        return new Promise((resolve, reject) => {
            this.props.form.validateFields((err, values) => {
                if (err) {
                    return;
                }

                const paramFilePath = useParams ? values.paramFilePath : null;

                resolve({
                    iterations: iterations,
                    paramMode: paramMode,
                    reopenSession: reopenSession,
                    paramFilePath: paramFilePath,
                    useIntellisense: useIntellisense,
                    env: env || null,
                    useAllParameters: paramFilePath ? useAllParameters : false
                });
            });   
        });
    }

    async validateFormFields() {
        const validateFieldsResults = await this.validateFields();
        
        return validateFieldsResults;
    }

    render() {
        
        const {
            iterations,
            paramFilePath,
            useParams,
            useIntellisense,
            // reopenSession,
            env,
            useAllParameters,
            paramMode
        } = this.state;
        const { projectSettings } = this.props;
        const { getFieldDecorator } = this.props.form;
        const envs = projectSettings && projectSettings.envs ? projectSettings.envs : null;
        const envList = envs ? Object.keys(envs) : null;
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
            >
                Browse...
            </button>
        );

        return (
            <Form>
                {envList &&
                <Form.Item label="Environment" {...formItemLayout} >
                    <Select 
                        defaultValue="default"
                        value={ env || undefined }
                        onChange={ (e) => ::this.onChangeEnvironment(e) }
                    >
                        { envList.map(e => 
                            <Option value={e} key={e}>{e}</Option>
                        )}
                    </Select>
                </Form.Item>
                }
                <Form.Item label="Iterations" {...formItemLayout} className="iterations-section" >
                    <InputNumber
                        disabled={useAllParameters}
                        min={1}
                        value={ iterations }
                        onChange={ (e) => ::this.onChangeIterations(e) }
                    />
                    {
                        useParams &&
                        <Checkbox 
                            name='useAllParameters'
                            checked={useAllParameters}
                            onChange={this.useAllParametersChange}
                        >
                            Use all parameters
                            <br></br>
                            (match parameters count)
                        </Checkbox >
                    }
                </Form.Item>
                {/* <Form.Item label="Re-Open Session" {...formItemLayout} extra="Create (re-open) a new or use an existing Selenium session on next iteration." >
                    <Switch onChange={ ::this.onReopenSessionChange } checked={ reopenSession } />
                </Form.Item> */}
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
                                value={paramMode}
                                defaultValue="sequential"
                                onChange={ (e) => ::this.onChangeParamMode(e) }
                            >
                                <Option value="random">Random</Option>
                                <Option value="sequential">Sequentially</Option>
                            </Select>
                        </Form.Item>
                    </Fragment>
                }
                <Form.Item label="Enable Intellisense" {...formItemLayout} extra="Enable/Disable Intellisense feature" >
                    <Switch onChange={ ::this.onUseIntellisenseChange } checked={ useIntellisense } />
                </Form.Item>
            </Form>
        );
    }
}

const EnhancedForm =  Form.create()(GeneralSettings);

export default class GeneralSettingsWrap extends React.PureComponent<Props> {
    render() {
        return (
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}

