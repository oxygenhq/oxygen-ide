import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

type Props = {
    onClose: Function
};

export default class NeedInstallExtension extends React.PureComponent<Props> {
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
