/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { Modal, Input, Button, Space, Typography } from 'antd';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
const { Paragraph, Text } = Typography;

export default class EncryptDecryptDialog extends React.PureComponent<Props> {
    constructor(props) {
        super(props);

        this.state = {
            value: ''
        };
    }

    onChange = (e) => {
        this.setState({
            value: e.target.value
        });
    };

    render() {
        const {
            value
        } = this.state;

        const {
            result,
            error,
            onCancel,
            onAction,
            loading
        } = this.props;

        return (
            <Modal
                title="Tools → Encrypt/Decrypt"
                open={ true }
                footer={ null }
                onCancel={ onCancel }
            >
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center'
                    }}
                >
                    <Input.Password
                        placeholder="text"
                        value={value}
                        onChange={this.onChange}
                    />
                    <Space.Compact
                        style={{
                            margin: '20px 0px'
                        }}
                    >
                        <Button
                            icon={<LockOutlined />}
                            onClick={ () => {
                                onAction({
                                    value: value,
                                    type: 'encrypt'
                                });
                            }}
                            disabled={value.length === 0}
                            loading={loading}
                        >
                            Encrypt
                        </Button>
                        <Button
                            icon={<UnlockOutlined />}
                            onClick={ () => {
                                onAction({
                                    value: value,
                                    type: 'decrypt'
                                });
                            }}
                            disabled={value.length === 0}
                            loading={loading}
                        >
                            Decrypt
                        </Button>
                    </Space.Compact>
                    {
                        typeof result === 'string' &&
                        <Paragraph
                            copyable
                            style={{
                                width: '100%',
                                textAlign: 'center'
                            }}
                        >
                            {result}
                        </Paragraph>
                    }
                    {
                        error &&
                        <Text type="danger">{error}</Text>
                    }
                </div>
            </Modal>
        );
    }
}