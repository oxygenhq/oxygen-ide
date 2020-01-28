//@flow
import React, { Fragment } from 'react';
import { Modal, Button, Checkbox } from 'antd';
import electron from 'electron';

type Props = {
  changeShowRecorderMessageValue: Function,
  showRecorderMessage: boolean | null,
  hide: Function
};

export default class WorkingChromeDialog extends React.Component<Props> {
    constructor(props){
        super(props);

        this.state = {
            showRecorderMessage: props.showRecorderMessage,
            showRecorderMessageInitialy: props.showRecorderMessage
        };
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
        const docsUrl = 'http://docs.oxygenhq.org';
        electron.shell.openExternal(docsUrl);
    }

    onChange = (e) => {
        const { changeShowRecorderMessageValue } = this.props;

        const checked = e.target.checked;

        this.setState({
            showRecorderMessage: checked
        }, () => {
            if(changeShowRecorderMessageValue){
                changeShowRecorderMessageValue(checked);
            }
        });
    }

    render(){

        const { 
            showRecorderMessage,
            showRecorderMessageInitialy
        } = this.state;

        if(showRecorderMessageInitialy === null){
            // Default value, user never change if
            // do nothing
        }

        if(showRecorderMessageInitialy === true){
            // User dont want to see this dialog
            return null;
        }

        if(showRecorderMessageInitialy === false){
            // User want to see this dialog
            // do nothing
        }


        return (
            <Modal
                title="Recording started"
                visible={true}
                onCancel={this.handleCancel}
                footer={
                    <Fragment>
                        <Checkbox 
                            className="dont-show-again-contol"
                            checked={showRecorderMessage}
                            onChange={this.onChange}
                        >Do not show this message again</Checkbox>
                        <Button
                            type="primary"
                            onClick={this.handleOk}
                        >Ok</Button>
                    </Fragment>
                }
            >
                <p>To start recording go to Chrome browser, open a new tab, and go to the required site.</p>
            </Modal>
        );
    }
}