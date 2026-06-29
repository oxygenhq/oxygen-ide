import React from 'react';
import { LoadingOutlined } from '@ant-design/icons';
import { Modal } from 'antd';

export default class EdgeDriverDownloadingDialog extends React.PureComponent {
    render() {
        return (
            <Modal
                className="hide-x-button"
                width={490}
                open={true}
                footer={null}
            >
                <div style={{textAlign: 'center'}}>
                    <LoadingOutlined style={{ fontSize: 24 }} spin />
                    <p style={{marginTop: '15px'}}>Downloading EdgeDriver ...</p>
                </div>
            </Modal>
        );
    }
}