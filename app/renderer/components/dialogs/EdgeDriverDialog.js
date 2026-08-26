import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';

type Props = {
    onCancel: Function,
    edgeDriverVersion: string,
    edgeVersion: string,
    onSubmit: Function,
    onNoChromeDriverSubmit: Function
};

export default class EdgeDriverDialog extends React.PureComponent<Props> {

    close = () => {
        if (this.props.onCancel) {
            this.props.onCancel();
        }
    };

    download = () => {
        const { edgeVersion, onNoChromeDriverSubmit } = this.props;

        if (edgeVersion) {
            this.props.onSubmit(edgeVersion);
        } else {
            if (onNoChromeDriverSubmit) {
                this.props.onNoChromeDriverSubmit();
            }
        }
    };

    render() {

        const { edgeVersion } = this.props;

        return (
            <Modal
                title="EdgeDriver Error"
                className="hide-x-button"
                width={490}
                open={true}
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
                    <p>{'Edge requires matching version of EdgeDriver. Current EdgeDriver is either outdated or missing.'}</p>
                    <p>{`Click Download to download the appropriate driver ${ edgeVersion ? `for Edge ${edgeVersion}.` : ''} `}</p>
                </div>
            </Modal>
        );
    }
}