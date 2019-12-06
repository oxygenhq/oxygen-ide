/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import electron from 'electron';
import React from 'react';
import { Modal, Button } from 'antd';

type Props = {
  visible: boolean,
  version?: string,
  url?: string,
  name?: string,
  path: string | undefined,
  type: string | undefined,
  onSubmit: () => void,
  onCancel: () => void
};

export default class UpdateDialog extends React.PureComponent<Props> {
    constructor(props){
        super(props);
        this.state = {
            visible: this.props.visible ? this.props.visible : false,
            name: this.props.name ? this.props.name : null,
        };
    }


    static getDerivedStateFromProps(nextProps, prevState) {
        if (nextProps.visible == false) {
            return ({
                visible: false,
            });
        }
        else if (nextProps.visible != prevState.visible) {
            return({
                visible: nextProps.visible,
                name: nextProps.name ? nextProps.name : null,
            });
        }
        return null;
    }

    onChangeName(e) {
        this.setState({
            name: e.target.value,
        });
    }

    handleOk() {
        const { name } = this.state;
        const { path, type } = this.props;
        if (!name || name.length == 0) {
            return;
        }
        this.props.onSubmit(path, type, name);
    }

    render() {
        const {
            version,
            url,
            onCancel,
        } = this.props;

        const {
            visible
        } = this.state;

        return (
            <div>
                {version ? (
                    <Modal
                        title="Update"
                        width={400}
                        visible={visible}
                        onCancel={onCancel}
                        footer={[
                            <Button
                                key="download"
                                type="primary"
                                onClick={() => {
                                    electron.shell.openExternal(url);
                                    this.props.onCancel();
                                }
                                }
                            >Download</Button>,
                            <Button
                                key="later"
                                type="default"
                                onClick={onCancel}
                            >Remind Me Later</Button>
                        ]}
                    >
                        <p>New version is available: {version}</p>
                    </Modal>
                ) : (
                    <Modal
                        title="Update"
                        width={400}
                        visible={visible}
                        onCancel={onCancel}
                        footer={
                            <Button
                                type="primary"
                                onClick={onCancel}
                            >OK</Button>
                        }
                    >
                        <p>No update available.</p>
                    </Modal>
                )}
            </div>
        );
    }
}
