/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import electron from 'electron';
import { Modal, Button } from 'antd';

export default function updateModals() {
    const { showNoUpdatesDialog, showUpdatesDialog, url, version } = this.state;
  
    return (
        <div>
            <Modal
                title="Update"
                width={400}
                visible={showNoUpdatesDialog}
                onCancel={() => { this.setState({ showNoUpdatesDialog: false }); }}
                footer={
                    <Button
                        type="primary"
                        onClick={() => this.setState({ showNoUpdatesDialog: false })}
                    >OK</Button>
                }
            >
                <p>No update available.</p>
            </Modal>

            <Modal
                title="Update"
                width={400}
                visible={showUpdatesDialog}
                onCancel={() => { this.setState({ showUpdatesDialog: false }); }}
                footer={[
                    <Button
                        key="download"
                        type="primary"
                        onClick={() => {
                            electron.shell.openExternal(url);
                            this.setState({ showNoUpdatesDialog: false });
                        }
                        }
                    >Download</Button>,
                    <Button
                        key="later"
                        type="default"
                        onClick={() => this.setState({ showUpdatesDialog: false })}
                    >Remind Me Later</Button>
                ]}
            >
                <p>New version is available: {version}</p>
            </Modal>
        </div>
    );
}
