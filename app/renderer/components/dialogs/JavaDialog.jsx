//@flow
import React from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

type Props = {
    javaError: Object | undefined,
    clean: Function
};

export default class JavaDialog extends React.PureComponent<Props> {
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
    
      let title;
      let message;

      if (javaError.reason === 'bad-version') {
          title = 'Unsupported Java version';
          message = (<p>Oxygen IDE requires Java 8-10 version.<br/>Your version: {javaError.version}.<br/><br/>Install <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE.</p>);
      } else {
          title = 'Unable to find Java';
          message = (<p>Install <a onClick={this.processLink}>Java 8</a> and restart Oxygen IDE.</p>);
      }

      return (
          <Modal
              title={title}
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
