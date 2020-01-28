import React, { Fragment } from 'react';
import { Modal, Button } from 'antd';

type Props = {
    onClose: Function
};

export default class ChromeDriverDownloadingSuccessDialog extends React.PureComponent<Props> {

    close = () => {
        if(this.props.onClose){
            this.props.onClose();
        }
    }

    render() {
        return (
            <Modal
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
                    <p>{'ChromeDriver was successfully installed. Restart the IDE for changes to take effect.'}</p> 
                </div>
            </Modal>
        );
    }
}