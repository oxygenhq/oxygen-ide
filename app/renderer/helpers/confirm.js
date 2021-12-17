import { Modal } from 'antd';

const confirm = (props = {}) => {
    return new Promise((resolve, reject) => {
        Modal.confirm({
            onOk() {
                resolve(true);
            },
            onCancel() {
                resolve(false);
            },
            ...props
        });
    });
};

export default confirm;