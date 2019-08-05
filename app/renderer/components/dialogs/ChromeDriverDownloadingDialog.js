import React, { PureComponent, Fragment } from 'react';
import { Modal, Button, Spin, Icon } from 'antd';

export default class ChromeDriverDownloadingDialog extends PureComponent {
    render() {

        const { chromeVersion } = this.props;

        return (
            <Modal
                className="hide-x-button"
                width={400}
                visible={true}
                footer={null}
            >
                <div style={{textAlign: 'center'}}>
                    <Icon type="loading" style={{ fontSize: 24 }} spin />
                    <p style={{marginTop: '15px'}}>Downloading ChromeDriver ...</p>
                </div>
            </Modal>
        );
    }
}