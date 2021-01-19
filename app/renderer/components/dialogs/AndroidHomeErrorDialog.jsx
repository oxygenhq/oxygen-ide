//@flow
import React from 'react';
import { Modal, Button } from 'antd';

type Props = {
    clean: Function,
    androidHomeError: string
};

export default class AndroidHomeErrorDialog extends React.PureComponent<Props> {
    close = () => {
        if (this.props.clean) {
            this.props.clean();
        }
    }
    
    render() {
        const {
            androidHomeError
        } = this.props;
        return (
            <Modal
                title="Device Discovery Service"
                width={480}
                visible={true}
                onCancel={this.close}
                footer={(
                    <React.Fragment>
                        <Button
                            onClick={this.close}
                        >
                            Ok
                        </Button>
                    </React.Fragment>
                )}
            >
                <div>
                    { androidHomeError }
                </div>
            </Modal>
        );
    }
}
