import React, { Fragment } from 'react';
import { Form, Input, Select, InputNumber, Switch } from 'antd';
const { Option } = Select;
import ServicesSingleton from '../../services';
const services = ServicesSingleton();

const DEFAULT_STATE = {
    iterations: 1,
    reopenSession: false,
    useParams: false,
    paramFilePath: null,
    paramMode: 'sequential',
};

// form layout settings
const formItemLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 14 },
};

type Props = {
    form: Object | undefined | null,
    visible: boolean | undefined,
    settings: Object | undefined
};


class GeneralSettings extends React.PureComponent<Props> {    
    constructor(props){
        super(props);
        this.state = {
            ...DEFAULT_STATE,
            iterations: props.settings.iterations || 1,
            paramMode: props.settings.paramMode || 'sequential',
            paramFilePath: props.settings.paramFilePath || null,
            reopenSession: props.settings.reopenSession || false,
            useParams: props.settings.paramFilePath != null,
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

    onReopenSessionChange(value) {
        this.setState({
            reopenSession: value,
        });
    }

    validateFields = () => {
        const { iterations, useParams, paramMode, reopenSession } = this.state;

        return new Promise((resolve, reject) => {
            this.props.form.validateFields((err, values) => {
                if (err) {
                    return;
                }

                resolve({
                    iterations: iterations,
                    paramMode: paramMode,
                    reopenSession: reopenSession,
                    paramFilePath: useParams ? values.paramFilePath : null,
                });
            });   
        });
    }

    async validateFormFields(){
        const validateFieldsResults = await this.validateFields();
        
        return validateFieldsResults;
    }

    render(){
        
        const {
            iterations,
            paramFilePath,
            useParams,
            reopenSession,
        } = this.state;

        const { getFieldDecorator } = this.props.form;

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

        return(
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
        );
    }
}

const EnhancedForm =  Form.create()(GeneralSettings);

export default class GeneralSettingsWrap extends React.PureComponent<Props> {
    render(){
        return(
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}

