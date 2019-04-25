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
    return null;
    
    return (
      <Modal
        title="Oxygen Chrome Extension is not installed or is disabled"
        visible={true}
        onOk={this.handleOk}
        okText={'Yes'}
        onCancel={this.handleCancel}
        cancelText={'No'}
      >
        <p>In order to record web pages, Oxygen Chrome Extension must be installed!</p>
        <p>Do you want to open a troubleshooting guide to solve this issue?</p>
      </Modal>
    )
  }
}