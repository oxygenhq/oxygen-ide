import React from 'react';
import { Button, Menu, Dropdown, Icon, Modal, Input } from 'antd';

type Props = {
    orAddToRoot: Function
};

export default class AddToRootRow extends React.PureComponent<Props> {
    constructor(props) {
        super(props);

        this.textInput = null;
        this.state = { 
            visible: false,
            name: '',
            key: null
        };
    }

    componentDidMount(){
        this.focusTextInput();
    }
  
    focusTextInput = () => {
        if (this.textInput && this.textInput.focus) this.textInput.focus();
    };
  
    setTextInputRef = element => {
        if(element){
            this.textInput = element;
            if(this.textInput && this.textInput.focus){
                this.textInput.focus();
            }
        }
    };
    
    handleCreate = e => {
        const {
            name,
            key
        } = this.state;

        const { orAddToRoot } = this.props;

        this.setState({
            visible: false,
            name: '',
            key: null
        }, () => {
            if(orAddToRoot && name && key){
                orAddToRoot(name, key);
            } else {
                console.warn('orAddToRoot && name && key', orAddToRoot, name, key);
            }
        });
    };
    
    handleCancel = e => {
        this.setState({
            visible: false,
            name: '',
            key: null
        });
    };

      
    handleMenuClick = ({key}) => {
        this.setState({
            visible: true,
            key: key
        });
    }

    onChangeName = (e) => {
        const nexName = e.target.value.trim();

        this.setState({
            name: nexName
        });
    }

    handleKeyPress = (e) => {
        const { name, key } = this.state;
        if (e.key === 'Enter' && key && !(!name || name.length === 0)) {
            this.handleCreate();
        }
    }

    render(){
        const { 
            visible,
            key,
            name
        } = this.state;
        let title = '';
    
        if(key){
            if(key === 'container'){
                title = 'Container';
            } else if(key === 'array_object'){
                title = 'Element';
            }
        }

        return(
            <div className="add-to-root-row">
                <Dropdown overlay={
                    <Menu onClick={this.handleMenuClick}>
                        <Menu.Item key="container">Container</Menu.Item>
                        <Menu.Item key="array_object">Element</Menu.Item>
                    </Menu>
                }>
                    <Button>
                    Add <Icon type="down" />
                    </Button>
                </Dropdown>
                <Modal
                    title={'Create '+title}
                    visible={visible}
                    onOk={this.handleCreate}
                    onCancel={this.handleCancel}
                    okText={'Create'}
                >
                    <Input
                        ref={this.setTextInputRef}
                        onKeyPress={this.handleKeyPress}
                        onChange={this.onChangeName}
                        value={name}
                        placeholder={`Enter new ${title} name...`}
                    />
                </Modal>
            </div>
        );
    }
}