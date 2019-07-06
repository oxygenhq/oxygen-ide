import React, { PureComponent } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

export default class JavaDialog extends PureComponent {
  clean = () => {
    if(this.props.clean){
      this.props.clean();
    }
  }

  processLink = (event) => {
    event.preventDefault();
    const javaUrl = 'https://www.java.com/en/download/';
    electron.shell.openExternal(javaUrl);
  }
  
  render() {    
    const {
      javaError
    } = this.props;
    
    let message;

    if(javaError && javaError.message && javaError.reason === 'bad-version'){
      message = (<p>{javaError.message} <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE"</p>);
    } else if(javaError && javaError.message && javaError.reason === 'not-found'){
      message = (<p>{javaError.message} <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE"</p>);
    } else if(javaError && javaError.message){
      message = (<p>{javaError.message}, try to install/reinstall <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE"</p>);
    } else {
      message = (<p>Uncatched error with Java, try to install/reinstall <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE"</p>);
    }

    return (
      <Modal
        title="Error with Java"
        width={400}
        visible={true}
        onCancel={this.clean}
        footer={
          <Button
            type="primary"
            onClick={this.clean}
          >OK</Button>
        }
      >
        <div>
          { message }
        </div>
      </Modal>
    );
  }
}
