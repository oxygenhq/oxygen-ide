import React, { Component } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

export default class NoChromeDialog extends Component<Props> {
  constructor(props){
    super(props);
  }

  handleOk = () => {
    this.processLink();
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
    const docsUrl = 'http://docs.oxygenhq.org';
    electron.shell.openExternal(docsUrl);
  }

  render(){
    return (
      <Modal
        title="Oxygen Chrome extension is not installed or is disabled"
        visible={true}
        onOk={this.handleOk}
        okText={'Yes'}
        onCancel={this.handleCancel}
        cancelText={'No'}
      >
        <p>Do you wan't to open docs page, to solwe this issue <a onClick={this.processLink}>Link</a></p>
      </Modal>
    )
  }
}