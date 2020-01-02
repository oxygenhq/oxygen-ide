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
import VisualTestingSettings from './VisualTestingProvidersSettings';
const { TabPane } = Tabs;

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
    onSubmit: () => void,
    onCancel: () => void
};

export default class SettingsDialog extends React.PureComponent<Props> {
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
        let visualTestingSettings = null;
        
        if(this.GeneralSettings && this.GeneralSettings.formWrap && this.GeneralSettings.formWrap.validateFormFields){
            generalSettingsResult = await this.GeneralSettings.formWrap.validateFormFields();
        }
        
        if(this.CloudProvidersSettings && this.CloudProvidersSettings.formWrap && this.CloudProvidersSettings.formWrap.validateFormFields){
            cloudProvidersResult = await this.CloudProvidersSettings.formWrap.validateFormFields();
        }
        
        if(this.VisualTestingSettings && this.VisualTestingSettings.formWrap && this.VisualTestingSettings.formWrap.validateFormFields){
            visualTestingSettings = await this.VisualTestingSettings.formWrap.validateFormFields();
        }

        this.props.onSubmit(generalSettingsResult, cloudProvidersResult, visualTestingSettings);
    }

    onTabChange = (key) => {
        this.setState({
            tabKey: key
        });
    }

    render() {
        const {
            settings,
            cloudProviders,
            visualProviders,
            visible,
            onCancel,
        } = this.props;

        return (
            <Modal
                title={'Run Settings'}
                className="scroll-y"
                okText="Save &amp; Close"
                width={700}
                visible={visible}
                onOk={this.handleOk.bind(this)}
                onCancel={onCancel}
                bodyStyle={ { overflow: 'hidden', overflowY: 'hidden', height: '425px' } }
            >
                <Tabs defaultActiveKey="1" onChange={this.onTabChange}>
                    <TabPane tab="General" key="1">
                        <GeneralSettings
                            ref={node => (this.GeneralSettings = node)}
                            settings={ settings }
                            visible={ visible }
                        />
                    </TabPane>
                    <TabPane tab="Cloud Providers" key="2">
                        <CloudProvidersSettings
                            ref={node => (this.CloudProvidersSettings = node)}
                            providers={ cloudProviders }
                            visible={ visible }
                        />
                    </TabPane>
                    <TabPane tab="Visual Testing" key="3">
                        <VisualTestingSettings
                            ref={node => (this.VisualTestingSettings = node)}
                            providers={ visualProviders }
                            visible={ visible }
                        />
                    </TabPane>
                </Tabs>
            </Modal>
        );
    }
}