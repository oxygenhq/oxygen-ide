import React from 'react';
import { Form, Input, Switch, Checkbox } from 'antd';

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

class VisualTestingProvidersSettings extends React.PureComponent<Props> {
  
    constructor(props){
        super(props);
        this.state = {
            ...DEFAULT_STATE,
            providers: props.providers
        };
    }
  
    onChangeApplitoolsAccessKey(value) {
        const { providers = {} } = this.state || {};
        const { applitools = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                applitools: {
                    ...applitools,
                    accessKey: value,
                }
            }
        });
    }
  
    onChangeApplitoolsCheckOnEveryAction(value) {
        const { providers = {} } = this.state || {};
        const { applitools = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                applitools: {
                    ...applitools,
                    checkOnEveryAction: value,
                }
            }
        });
    }

    onUseApplitoolsChange(value) {
        const { providers = {} } = this.state || {};
        const { applitools = {} } = providers;
        this.setState({
            providers: {
                ...this.state.providers,
                applitools: {
                    ...applitools,
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
    
    render(){
        
        const {
            providers = {}
        } = this.state;

        const {
            applitools = {},
        } = providers;
        

        return(
            <Form>
                {/* //////////// APPLITOOLS //////////// */}
                <Form.Item label="Applitools" {...formItemLayout} extra="Use Applitools to add visual checkpoints." >
                    <Switch onChange={ ::this.onUseApplitoolsChange } checked={ applitools.inUse } />
                </Form.Item>
                { applitools && applitools.inUse &&
            <div className="cloud-providers-form-wrap cloud-providers-form-wrap-margin-bottom">
                <Form.Item label="Applitools Settings" style={ {fontWeight: 'bold'} } {...formItemLayout}/>
                <Form.Item label="Access Key" {...formItemLayout} >
                    <Input.Password
                        value={ applitools.accessKey }
                        onChange={ (e) => ::this.onChangeApplitoolsAccessKey(e.target.value) }
                    />
                </Form.Item>
                <Form.Item label="Auto Check on Every Action" {...formItemLayout} >
                    <Checkbox
                        checked={ applitools.checkOnEveryAction || false }
                        onChange={ (e) => ::this.onChangeApplitoolsCheckOnEveryAction(e.target.checked) }
                    />
                </Form.Item>
            </div>
                }
            </Form>
        );
    }
}

const EnhancedForm =  Form.create()(VisualTestingProvidersSettings);

export default class GeneralSettingsWrap extends React.PureComponent<Props> {
    render(){
        return(
            <EnhancedForm wrappedComponentRef={(form) => this.formWrap = form} {...this.props} />
        );
    }
}
