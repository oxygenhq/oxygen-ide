import React from 'react';
import { Modal, Icon } from 'antd';

export default class EdgeDriverDownloadingDialog extends React.PureComponent {
    render() {
        return (
            <Modal
                className="hide-x-button"
                width={490}
                visible={true}
                footer={null}
            >
                <div style={{textAlign: 'center'}}>
                    <Icon type="loading" style={{ fontSize: 24 }} spin />
                    <p style={{marginTop: '15px'}}>Downloading EdgeDriver ...</p>
                </div>
            </Modal>
        );
    }
}