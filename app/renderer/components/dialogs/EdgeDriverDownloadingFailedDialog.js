import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

type Props = {
    onClose: Function,
    path: string
};

export default class EdgeDriverDownloadingFailedDialog extends React.PureComponent<Props> {

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
                    <p>{'Download the appropriate driver for your version of Edge from'} <a href='https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/' onClick={this.processLink}>here.</a></p>
                    <p>{'Extract the archive.'}</p>
                    <p>{`Place the EdgeDriver executable directly into ${path} or into ${path + require('path').sep}edgedriver-{versionname} folder where {versionname} is the driver's version.`}</p>
                    <p>{'Restart Oxygen IDE afterwards for the changes to take effect. '}</p>
                </div>
            </Modal>
        );
    }
}