import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';

type Props = {
    onCancel: Function,
    chromeDriverVersion: string,
    chromeVersion: string,
    onSubmit: Function,
    onNoChromeDriverSubmit: Function
};

export default class ChromeDriverDialog extends React.PureComponent<Props> {

    close = () => {
        if(this.props.onCancel){
            this.props.onCancel();
        }
    }

    download = () => {
        const { chromeVersion, onNoChromeDriverSubmit } = this.props;

        if(chromeVersion){
            this.props.onSubmit(chromeVersion);
        } else {
            if(onNoChromeDriverSubmit){
                this.props.onNoChromeDriverSubmit();
            }
        }
    }

    render() {

        const { chromeVersion } = this.props;

        return (
            <Modal
                title="ChromeDriver Error"
                className="hide-x-button"
                width={490}
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
                    <p>{'Chrome requires matching version of ChromeDriver. Currently installed ChromeDriver is outdated.'}</p> 
                    <p>{`Click Download to download the appropriate driver for Chrome ${chromeVersion}.`}</p>
                </div>
            </Modal>
        );
    }
}