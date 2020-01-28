import React, { Fragment } from 'react';
import { Input, Button, Icon } from 'antd';
import '../../css/locators-changer.scss';

export default class LocatorsChanger extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);
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
          console.error('Locator name cannot be blank!');
          return;
      }
      if(this.props.addLocator){
          this.props.addLocator(text);
          this.setState({
              text: '',
              addLocator: !this.state.addLocator
          });
      }
  }

  update = () => {
      const { editStr, finishEdit } = this.props;

      if(editStr && finishEdit){
          finishEdit(editStr);
          this.setState({
              text: ''
          });
      } else {
      // looks line need delete element or do nothing
      }
  }

  cancelUpdate = () => {
      const { cancelEdit } = this.props;

      if(cancelEdit){
          cancelEdit();
      }
  }

  toggleAdd = () => {
      this.setState({
          addLocator: !this.state.addLocator
      });
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
          length,
          locator
      } = this.props;
      const { text, addLocator } = this.state;
    
      let child = null;

      if(editing){
          child =  (
              <div className="locators-update-container">
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
                  >{ locator ? 'Add' : 'Update' }</Button>
                  <Button 
                      onClick={ this.cancelUpdate }
                      className="add-btn"
                  >Cancel</Button>
              </div>
          );
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
                      disabled={ !text }
                      onClick={ this.add }
                      className="add-btn"
                      type="primary"
                  >Add</Button>
              </div>
          );
      }

      const freezAllBtns = editing || addLocator;

      const locatorNameCondition = ['number','string'].includes(typeof selectedLocatorName);

      const upDisabled = freezAllBtns || !locatorNameCondition || (selectedLocatorIndex === 0);
      const downDisabled = freezAllBtns || !locatorNameCondition || (selectedLocatorIndex+1 === length);
    
      return (
          <Fragment>
              {
                  !locator &&
          <div className="locators-changer-container">
              <div onClick={ () => {!(!addLocator && freezAllBtns) && this.toggleAdd();}} className={`control ${ (!addLocator && freezAllBtns) ? 'disabled' : '' }`}>
                  <Icon type={ addLocator ? 'minus' : 'plus' } />
              </div>
  
              <div className="control-group">
                  <div onClick={() => {!upDisabled && this.up();}} className={`control ${ upDisabled ? 'disabled' : '' }`}>
                      <Icon type="up" />
                  </div>
                  <div onClick={() => {!downDisabled && this.down();}} className={`control ${ downDisabled ? 'disabled' : '' }`}>
                      <Icon type="down" />
                  </div>
              </div>
  
              <div className="control-group">
                  <div onClick={() => { locatorNameCondition && this.edit(); }} className={`control ${ !locatorNameCondition ? 'disabled' : '' }`}>
                      <Icon type="edit" />
                  </div>
                  <div onClick={() => { locatorNameCondition && this.remove(); }} className={`control ${ !locatorNameCondition ? 'disabled' : '' }`}>
                      <Icon type="delete" />
                  </div>
              </div>
          </div>
              }
              {child}
          </Fragment>
      );
  }
}