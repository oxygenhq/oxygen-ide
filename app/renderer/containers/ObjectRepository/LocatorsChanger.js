import React, { PureComponent, Fragment } from 'react';
import { Input, Button, Icon } from 'antd';
import '../../css/locators-changer.scss';

export default class LocatorsChanger extends PureComponent<Props> {
  constructor(props: Props) {
    super(props: Props);
    this.state = {
      text: '',
      addLocator: false
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
      this.setState({
        text: '',
        addLocator: !this.state.addLocator
      })
    }
  }

  update = () => {
    const { editStr, finishEdit } = this.props;

    if(editStr && finishEdit){
      finishEdit(editStr);
      this.setState({
        text: ''
      })
    } else {
      // looks line need delete element or do nothing
    }
  }

  toggleAdd = () => {
    this.setState({
      addLocator: !this.state.addLocator
    })
  }

  remove = () => {
    const { 
      remove,
      selectedLocatorName 
    } = this.props;

    if(remove){
      remove(selectedLocatorName);
    }
  }

  edit = () => {
    const { 
      startEdit,
      selectedLocatorName 
    } = this.props;

    if(startEdit){
      startEdit(selectedLocatorName);
    }
  }

  up = () => {
    const { 
      moveLocator,
      selectedLocatorName 
    } = this.props;
    
    if(moveLocator){
      moveLocator(selectedLocatorName, 'up');
    }
  }

  down = () => {
    const { 
      moveLocator,
      selectedLocatorName 
    } = this.props;
    
    if(moveLocator){
      moveLocator(selectedLocatorName, 'down');
    }
  }

  render() {
    const { 
      editing, 
      editStr, 
      selectedLocatorName, 
      selectedLocatorIndex,
      length 
    } = this.props;
    const { text, addLocator } = this.state;
    
    let child = null;

    if(editing){
      child =  (
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
      child = (
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

    return (
      <Fragment>
        <div className="locators-changer-container">
          <div onClick={this.toggleAdd} className="control">
            <Icon type={ addLocator ? "minus" : "plus" } />
          </div>

          <div className="control-group">
            <div onClick={this.up} className={`control ${ ( !selectedLocatorName || (selectedLocatorIndex === 0) ) ? 'disabled' : '' }`}>
              <Icon type="up" />
            </div>
            <div onClick={this.down} className={`control ${ ( !selectedLocatorName || (selectedLocatorIndex+1 === length) ) ? 'disabled' : '' }`}>
              <Icon type="down" />
            </div>
          </div>

          <div className="control-group">
            <div onClick={this.edit} className={`control ${ !selectedLocatorName ? 'disabled' : '' }`}>
              <Icon type="edit" />
            </div>
            <div onClick={this.remove} className={`control ${ !selectedLocatorName ? 'disabled' : '' }`}>
              <Icon type="delete" />
            </div>
          </div>
        </div>
        {child}
      </Fragment>
    )

    return null;
  }
}