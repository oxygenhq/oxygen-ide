/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { Modal, Input, Button, Typography } from 'antd';
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
    }

    render() {
        const {
            value
        } = this.state;

        const {
            result,
            error,
            onCancel,
            onAction
        } = this.props;

        return (
            <Modal
                title="Tools → Encrypt/Decrypt"
                visible={ true }
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
                    <Button.Group
                        style={{
                            margin: '20px 0px'
                        }}
                    >
                        <Button
                            icon="lock"
                            onClick={ () => {
                                onAction({
                                    value: value,
                                    type: 'encrypt'
                                });
                            }}
                            disabled={value.length === 0}
                        >
                            Encrypt
                        </Button>
                        <Button
                            icon="unlock"
                            onClick={ () => {
                                onAction({
                                    value: value,
                                    type: 'decrypt'
                                });
                            }}
                            disabled={value.length === 0}
                        >
                            Decrypt
                        </Button>
                    </Button.Group>
                    {
                        typeof result === 'string' &&
                        <Paragraph
                            copyable
                            style={{
                                width: '200px',
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