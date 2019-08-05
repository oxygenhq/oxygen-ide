import React, { PureComponent, Fragment } from 'react';
import { Modal, Button } from 'antd';

export default class ChromeDriverDialog extends PureComponent {

    close = () => {
        if(this.props.onCancel){
            this.props.onCancel();
        }
    }

    download = () => {
        const { onSubmit, chromeDriverVersion } = this.props;
        if(chromeDriverVersion){
            this.props.onSubmit(chromeDriverVersion);
        }
    }

    render() {

        const { chromeVersion } = this.props;

        return (
            <Modal
                title="ChromeDriver error"
                width={400}
                visible={true}
                footer={(
                    <Fragment>
                        <Button
                            type="primary"
                            onClick={this.download}
                        >
                            Download
                        </Button>
                        <Button
                            onClick={this.close}
                        >
                            Cancel
                        </Button>
                    </Fragment>
                )}
            >
                <div>
                    <p>{`Chrome requires matching version of ChromeDriver. Currently installed ChromeDriver is outdated.`}</p> 
                    <p>{`Click Download to download the appropriate driver for Chrome ${chromeVersion}.`}</p>
                </div>
            </Modal>
        );
    }
}