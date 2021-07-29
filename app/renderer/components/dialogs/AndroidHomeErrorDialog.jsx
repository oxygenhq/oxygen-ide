//@flow
import React from 'react';
import electron from 'electron';
import { Modal, Button, Checkbox } from 'antd';

type Props = {
    clean: Function,
    hideAndroidHomeError: boolean,
    changeShowShowAndroidHomeError: Function
};

export default class AndroidHomeErrorDialog extends React.PureComponent<Props> {
    constructor(props) {
        super(props);

        this.state = {
            hideAndroidHomeError: props.hideAndroidHomeError,
            hideAndroidHomeErrorInitialy: props.hideAndroidHomeError
        };
    }

    close = () => {
        if (this.props.clean) {
            this.props.clean();
        }
    }
    
    onShowEgainChange = (e) => {
        const { changeShowShowAndroidHomeError } = this.props;

        const checked = e.target.checked;

        this.setState({
            hideAndroidHomeError: checked
        }, () => {
            if (changeShowShowAndroidHomeError) {
                changeShowShowAndroidHomeError(checked);
            }
        });
    }

    processLink = (event) => {
        if (event) {
            event.preventDefault();
  
            if (event.target instanceof HTMLAnchorElement) {
                const url = event.target.getAttribute('href');
                electron.shell.openExternal(url);
            } else {
                console.log('bad event.target', event.target);
            }
        }
    }
    
    render() {
        const { 
            hideAndroidHomeError,
            hideAndroidHomeErrorInitialy
        } = this.state;

        if (hideAndroidHomeErrorInitialy === true) {
            // User don't want to see this dialog
            return null;
        }

        return (
            <Modal
                title="Device Discovery Service"
                width={480}
                visible={true}
                onCancel={this.close}
                maskClosable={false}
                footer={(
                    <React.Fragment>
                        <Checkbox 
                            className="dont-show-again-contol"
                            checked={hideAndroidHomeError}
                            onChange={this.onShowEgainChange}
                        >
                            Do not show this message again
                        </Checkbox>
                        <Button
                            onClick={this.close}
                        >
                            Ok
                        </Button>
                    </React.Fragment>
                )}
            >
                <div>
                    <p>Unable to find Android SDK.</p>
                    <p>In order to run tests on Android devices, the Android SDK must be installed and either ANDROID_HOME or ANDROID_SDK_ROOT environment variable should point to the SDK directory. Remember to restart Oxygen IDE after any modifications to ANDROID_HOME or ANDROID_SDK_ROOT environment variables.</p>
                    <p>
                        See <a
                            onClick={this.processLink}
                            href="https://guides.codepath.com/android/installing-android-sdk-tools"
                        >
                            Installing Android SDK Tools
                        </a> for more information.
                    </p>
                </div>
            </Modal>
        );
    }
}
