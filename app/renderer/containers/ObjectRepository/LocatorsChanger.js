import React, { PureComponent, Fragment } from 'react';
import { Input, Button } from 'antd';
import '../../css/locators-changer.scss';

export default class LocatorsChanger extends PureComponent<Props> {
  constructor(props: Props) {
    super(props: Props);
    this.state = {
      text: ''
    };

     this.inputRef = React.createRef();
  }

  onChange = (e) => {
    const nexText = e.target.value.trim();

    this.setState({ 
      text: nexText
    });
  }

  onChangeUpdate = (e) => {
    const nexText = e.target.value.trim();

    if(this.props.onChangeUpdate){
      this.props.onChangeUpdate(nexText);
    }
  }

  add = () => {
    const { text } = this.state;
    if (!text || text.length == 0) {
      message.error(`Locator name cannot be blank!`);
      return;
    }
    if(this.props.addLocator){
      this.props.addLocator(text);
    }
  }

  update = () => {
    const { editStr, finishEdit } = this.props;

    if(editStr && finishEdit){
      finishEdit(editStr);
    } else {
      // looks line need delete element or do nothing
    }
  }

  render() {
    const { editing, editStr, addLocator } = this.props;
    const { text } = this.state;
    
    if(editing){
      return (
        <div className="locators-changer-container">
          <Input 
            ref={this.inputRef} 
            value={ editStr }
            onChange={ this.onChangeUpdate }
            placeholder="Locator" 
          />
          <Button 
            onClick={ this.update }
            className="add-btn"
            type="primary"
          >Update</Button>
        </div>
      )
    }

    if(addLocator){
      return (
        <div className="locators-changer-container">
          <Input 
            ref={this.inputRef} 
            value={ text }
            onChange={ this.onChange }
            placeholder="Locator" 
          />
          <Button 
            onClick={ this.add }
            className="add-btn"
            type="primary"
          >Add</Button>
        </div>
      )
    }

    return null;
  }
}