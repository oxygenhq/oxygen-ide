//@flow
import React from 'react';
import { Modal, Button } from 'antd';

type Props = {
    clean: Function
};

export default class XCodeDialog extends React.PureComponent<Props> {
  close = () => {
      if (this.props.clean) {
          this.props.clean();
      }
  }
  
  render() {
      return (
          <Modal
              title="Device Discovery Service"
              width={480}
              visible={true}
              onCancel={this.close}
              footer={(
                  <React.Fragment>
                      <Button
                          onClick={this.close}
                      >
              Ok
                      </Button>
                  </React.Fragment>
              )}
          >
              <div>
                  { 'Could not find neither `instruments` nor `xctrace` binaries.' }
                  <br />
                  <br />
                  { 'Please ensure `xcrun -find instruments` (Xcode 11 or lower) or `xcrun -find xctrace` (Xcode 12 or higher) is able to locate it.' }
                  <br />
                  <br />
                  { 'Possible reasons for this could be: Xcode not being installed or license not accepted for `xcrun`.' }
              </div>
          </Modal>
      );
  }
}
