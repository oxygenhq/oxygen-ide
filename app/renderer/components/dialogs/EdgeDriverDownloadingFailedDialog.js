import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';
import electron from 'electron';

type Props = {
    onClose: Function,
    path: string
};

const pathStyle = {
    background: 'rgba(150, 150, 150, 0.2)',
    padding: '1px 4px',
    borderRadius: 3
};

export default class EdgeDriverDownloadingFailedDialog extends React.PureComponent<Props> {

    close = () => {
        if (this.props.onClose) {
            this.props.onClose();
        }
    };

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
    };

    render() {

        const {path} = this.props;

        return (
            <Modal
                title="Unable to download the driver"
                className="hide-x-button"
                success
                width={490}
                open={true}
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
                    <p>
                        {'Place the EdgeDriver executable directly into:'}<br/>
                        <code style={pathStyle}>{path}</code>
                        <br/><br/>
                        {'or into a version-specific subfolder:'}<br/>
                        <code style={pathStyle}>{`${path}${require('path').sep}edgedriver-{versionname}`}</code>
                        {' (where {versionname} is the driver\'s version).'}
                    </p>
                    <p>{'Restart Oxygen IDE afterwards for the changes to take effect. '}</p>
                </div>
            </Modal>
        );
    }
}
