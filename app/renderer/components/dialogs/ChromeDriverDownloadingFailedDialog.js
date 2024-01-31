import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

type Props = {
    onClose: Function,
    path: string
};

export default class ChromeDriverDownloadingFailedDialog extends React.PureComponent<Props> {

    close = () => {
        if (this.props.onClose) {
            this.props.onClose();
        }
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

        const {path} = this.props;

        return (
            <Modal
                title="Unable to download the driver"
                className="hide-x-button"
                success
                width={490}
                visible={true}
                footer={(
                    <Fragment>
                        <Button
                            type="primary"
                            onClick={this.close}
                        >
                            Ok
                        </Button>
                    </Fragment>
                )}
            >
                <div>
                    <p>{'Download the appropriate driver for your version of Chrome from'} <a href='https://googlechromelabs.github.io/chrome-for-testing' onClick={this.processLink}>here.</a></p>
                    <p>{'Extract the archive.'}</p>
                    <p>{`Place the ChromeDriver executable directly into ${path} or into ${path + require('path').sep}chromedriver-{versionname} folder where {versionname} is the driver's version.`}</p>
                    <p>{'If you encounter security related problems on Mac, see'} <a href='https://www.macworld.co.uk/how-to/mac-app-unidentified-developer-3669596/' onClick={this.processLink}>link</a></p>
                    <p>{'Restart Oxygen IDE afterwards for the changes to take effect. '}</p>

                </div>
            </Modal>
        );
    }
}
