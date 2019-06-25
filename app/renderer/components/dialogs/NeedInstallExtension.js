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
    const oxygenUrl = 'http://docs.oxygenhq.org/install-osx.html';
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
              Skip Installation
            </Button>
          </Fragment>
        )}
      >
        <div>
          { 'In order for Oxygen to record web tests, Oxygen Chrome extension must be installed.' }
        </div>
      </Modal>
    );
  }
}
