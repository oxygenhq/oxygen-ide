/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { Tabs, Modal } from 'antd';
import GeneralSettings from './GeneralSettings';
import CloudProvidersSettings from './CloudProvidersSettings';
import IntegrationsSettings from './IntegrationsSettings';
import RunSettings from './RunSettings';

const DEFAULT_STATE = {
    tabKey: 1,
    visible: false,
};

type Props = {
    settings: Object | undefined,
    providers: Object | undefined,
    visible: boolean | undefined,
    cloudProviders: Object | undefined,
    visualProviders: Object | undefined,
    runSettings: Object | undefined,
    generalSettings: Object | undefined,
    projectSettings: Object | undefined,
    integrations: Object | undefined,
    onSubmit: () => void,
    onCancel: () => void
};

export default class SettingsDialog extends React.PureComponent<Props> {
    props: Props;

    state = {
        ...DEFAULT_STATE,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
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
            };
        }
        // else, leave the previous state 
        return null;
    }
  
  
    async handleOk() {
        let generalSettingsResult = null;
        let cloudProvidersResult = null;
        let integrationsSettings = null;
        let runSettings = null;
        
        if (
            this.GeneralSettings &&
            this.GeneralSettings.formWrap &&
            this.GeneralSettings.formWrap.validateFormFields
        ) {
            generalSettingsResult = await this.GeneralSettings.formWrap.validateFormFields();
        }
        
        if (
            this.CloudProvidersSettings &&
            this.CloudProvidersSettings.formWrap &&
            this.CloudProvidersSettings.formWrap.validateFormFields
        ) {
            cloudProvidersResult = await this.CloudProvidersSettings.formWrap.validateFormFields();
        }
        
        if (
            this.IntegrationsSettings &&
            this.IntegrationsSettings.formWrap &&
            this.IntegrationsSettings.formWrap.validateFormFields
        ) {
            integrationsSettings = await this.IntegrationsSettings.formWrap.validateFormFields();
        }

        if (
            this.RunSettings &&
            this.RunSettings.formWrap &&
            this.RunSettings.formWrap.validateFormFields
        ) {
            runSettings = await this.RunSettings.formWrap.validateFormFields();
        }

        this.props.onSubmit(generalSettingsResult, cloudProvidersResult, integrationsSettings, runSettings);
    }

    onTabChange = (key) => {
        this.setState({
            tabKey: key
        });
    };

    render() {
        const {
            generalSettings,
            projectSettings,
            integrations,
            cloudProviders,
            runSettings,
            visible,
            onCancel,
        } = this.props;

        return (
            <Modal
                title={'Settings'}
                className="scroll-y"
                okText="Save &amp; Close"
                width={700}
                open={visible}
                onOk={this.handleOk.bind(this)}
                onCancel={onCancel}
                styles={{ body: { overflow: 'hidden', overflowY: 'hidden', height: '425px' } }}
            >
                <Tabs
                    defaultActiveKey="1"
                    onChange={this.onTabChange}
                    items={[
                        {
                            key: '1',
                            label: 'General',
                            children: (
                                <GeneralSettings
                                    ref={node => (this.GeneralSettings = node)}
                                    settings={ generalSettings }
                                    projectSettings={ projectSettings }
                                    visible={ visible }
                                />
                            ),
                        },
                        {
                            key: '2',
                            label: 'Cloud Providers',
                            children: (
                                <CloudProvidersSettings
                                    ref={node => (this.CloudProvidersSettings = node)}
                                    providers={ cloudProviders }
                                    visible={ visible }
                                />
                            ),
                        },
                        {
                            key: '3',
                            label: 'Integrations',
                            children: (
                                <IntegrationsSettings
                                    ref={node => (this.IntegrationsSettings = node)}
                                    providers={ integrations }
                                    visible={ visible }
                                />
                            ),
                        },
                        {
                            key: '4',
                            label: 'Run settings',
                            children: (
                                <RunSettings
                                    ref={node => (this.RunSettings = node)}
                                    runSettings={ runSettings }
                                    visible={ visible }
                                />
                            ),
                        },
                    ]}
                />
            </Modal>
        );
    }
}