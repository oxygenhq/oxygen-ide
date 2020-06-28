import React from 'react';
import { Form, Switch } from 'antd';

// form layout settings
const formItemLayout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 14 },
};

const DEFAULT_STATE = {
    runSettings: {},
};

class RunSettings extends React.PureComponent<Props> {    
    constructor(props) {
        super(props);
        this.state = {
            ...DEFAULT_STATE,
            runSettings: props.runSettings
        };
    }

    onNpmGRootExecutionChange(value) {
        const { runSettings = {} } = this.state || {};
        this.setState({
            runSettings: {
                ...runSettings,
                npmGRootExecution: value,
            }
        });
    }
  
    validateFields() {
        const { runSettings } = this.state;
        
        return new Promise((resolve, reject) => {
            this.props.form.validateFields((err, values) => {
                if (err) {
                    return;
                }
                resolve(runSettings);
            });   
        });
    }
    
    async validateFormFields() {
        const validateFieldsResults = await this.validateFields();
        
        return validateFieldsResults;
    }
    

    render() {
        
        const {
            runSettings = {}
        } = this.state;

        const {
            npmGRootExecution
        } = runSettings;

        return (
            <Form>
                {/* //////////// APPLITOOLS //////////// */}
                <Form.Item label="“npm -g root” execution" {...formItemLayout} extra="Enable/disable “npm -g root” execution" >
                    <Switch onChange={ ::this.onNpmGRootExecutionChange } checked={ npmGRootExecution } />
                </Form.Item>
            </Form>
        );
    }
}

const EnhancedForm =  Form.create()(RunSettings);

export default class RunSettingsWrap extends React.PureComponent<Props> {
    render() {
        return (
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}

