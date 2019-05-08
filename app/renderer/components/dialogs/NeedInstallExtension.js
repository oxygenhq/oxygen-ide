import React, { PureComponent, Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

export default class NeedInstallExtension extends PureComponent {
  close = () => {
    if(this.props.onClose){
      this.props.onClose();
    }
  }

  processLink = () => {
    const oxygenUrl = 'https://chrome.google.com/webstore/detail/oxygen/ibbmgejonlmocgjnkmabigdgbolcomea';
    electron.shell.openExternal(oxygenUrl);
    this.close();
  }
  
  render() {
    return (
      <Modal
        title="Tests Recording Support"
        width={400}
        visible={true}
        onCancel={this.close}
        footer={(
          <Fragment>
            <Button
              type="primary"
              onClick={this.processLink}
            >
              Install Extension
            </Button>
            <Button
              onClick={this.close}
            >
              Skip installation
            </Button>
          </Fragment>
        )}
      >
        <div>
          { 'In Order for Oxygen to record web tests, we need to install Oxygen extension for Chrome.' }
        </div>
      </Modal>
    );
  }
}
