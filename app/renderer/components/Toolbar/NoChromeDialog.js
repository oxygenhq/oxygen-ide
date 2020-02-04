import React from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

export default class NoChromeDialog extends React.Component<Props> {
    constructor(props){
        super(props);
    }

  handleOk = () => {
      this.handleCancel();
  }

  handleCancel = () => {
      if(this.props.hide){
          this.props.hide();
      }
  }

  
  processLink = (event) => {
      if(event){
          event.preventDefault();
      }
      const docsUrl = 'http://docs.oxygenhq.org/download-and-installation/recording-troubleshooting';
      electron.shell.openExternal(docsUrl);
  }

  render(){
    
      return (
          <Modal
              title="Unable to connect to Oxygen Chrome extension."
              visible={true}
              onCancel={this.handleCancel}
              footer={
                  <Button
                      type="primary"
                      onClick={this.handleOk}
                  >Ok</Button>
              }
          >
              <p>In order to record web sites Chrome must be running and Oxygen extension for Chrome installed & enabled.</p>
              <p>Please see the <a onClick={this.processLink}>Troubleshooting Guide</a> for more information.</p>
          </Modal>
      );
  }
}