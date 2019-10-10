import React, { PureComponent, Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

export default class XCodeDialog extends PureComponent {
  close = () => {
    if(this.props.clean){
      this.props.clean();
    }
  }

  processLink = () => {
    const oxygenUrl = 'http://appium.io/docs/en/drivers/ios-xcuitest-real-devices/';
    electron.shell.openExternal(oxygenUrl);
    this.close();
  }
  
  render() {
    return (
      <Modal
        title="Run tests support"
        width={400}
        visible={true}
        onCancel={this.close}
        footer={(
          <Fragment>
            <Button
              type="primary"
              onClick={this.processLink}
            >
              Read More
            </Button>
            <Button
              onClick={this.close}
            >
              Skip
            </Button>
          </Fragment>
        )}
      >
        <div>
          { 'You need to install XCode in order to run tests on iOS devices or emulators. Please click "Read More" button for  more details."' }
        </div>
      </Modal>
    );
  }
}
