/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { PureComponent, Fragment } from 'react';
import { Button } from 'antd';
import List from '../../components/core/List';
import Panel from '../../components/Panel';
import LocatorsChanger from './LocatorsChanger';
import { connectableObservableDescriptor } from 'rxjs/internal/observable/ConnectableObservable';

type Props = {
  object: null | object,
};

const EmptyList = () => {
  return (
      <div className="no-data">
          <p>No Data</p>
      </div>
  );
}

export default class ObjectEditor extends PureComponent<Props> {
  props: Props;

  state = {
    selectedLocatorName: null,
    selectedLocatorIndex: null,
    object: null,
    editStr: null,
    editing: false
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.active !== nextProps.active) {
      if (!nextProps.object) {
        this.setState({
          object: null,
        });
      }
      else {
        this.setState({
          object: nextProps.object,
        });
      }
    }
  }

  addLocator = (name) => {
    const { object } = this.props;
    const { path } = object;

    if(this.props.addLocator){
      this.props.addLocator(path, name);
    }
  }

  select = (selectedName, index) => {
    const { selectedLocatorName } = this.state;
    const { object } = this.props;
    const { path } = object;
    let newSelectedLocatorName;
    let newSelectedLocatorIndex;

    if(selectedName === selectedLocatorName){
      newSelectedLocatorName = null;
      newSelectedLocatorIndex = null;
    } else {
      newSelectedLocatorName = selectedName;
      newSelectedLocatorIndex = index;
    }

    this.setState({
      selectedLocatorName: newSelectedLocatorName,
      selectedLocatorIndex: index
    })
  }

  remove = (name) => {
    const { object } = this.props;
    const { path } = object;

    if(this.props.removeObjectOrFolder){
      this.props.removeObjectOrFolder(path, name);
      
      this.setState({
        selectedLocatorName: null,
        selectedLocatorIndex: null
      });      
    }
  }

  startEdit = (name, path = null) => {
    this.setState({
      editStr: name,
      originStr: name,
      originPath: path,
      editing: true
    })
  }

  finishEdit = (name) => {
    const { originStr } = this.state;
    const { object } = this.props;
    const { path } = object;

    this.setState({
      editStr: null,
      editing: false
    },
    () => {
      if(this.props.updateLocator){
        this.props.updateLocator(path, name, originStr);
      }
    })
  }

  moveLocator = (name, direction) => {
    const { selectedLocatorIndex } = this.state;
    const { object } = this.props;
    const { path } = object;
    
    this.setState({
      selectedLocatorName: null,
      selectedLocatorIndex: null
    },
    () => {
      if(this.props.moveLocator){
        this.props.moveLocator(path, name, direction, selectedLocatorIndex);
      }
    });    
  }

  finishEditLocator = (name) => {
    const { originPath } = this.state;

    this.setState({
      editStr: null,
      editing: false
    },
    () => {
      if(this.props.updateLocatorValue){
        this.props.updateLocatorValue(originPath, name);
      }
    })
  }

  onChangeUpdate = (name) => {
    this.setState({
      editStr: name
    })
  }

  renderLocatorChanger() {
    const { object } = this.props;
    const { 
      selectedLocatorName,
      selectedLocatorIndex
    } = this.state;

    if(object && object.children && object.children.length) {
      return (
        <LocatorsChanger 
          moveLocator={this.moveLocator}
          startEdit={this.startEdit}
          selectedLocatorName={ selectedLocatorName }
          selectedLocatorIndex={ selectedLocatorIndex }
          length={ object.children.length }
          remove={ this.remove }
          editing={ this.state.editing }
          editStr={ this.state.editStr }
          onChangeUpdate={ this.onChangeUpdate }
          finishEdit={ this.finishEdit }
          addLocator={this.addLocator} 
        />
      )
    }

    if(object && object.children && object.children.length === 0) {
      return(
        <LocatorsChanger 
          moveLocator={this.moveLocator}
          startEdit={this.startEdit}
          selectedLocatorName={ selectedLocatorName }
          remove={ this.remove }
          addLocator={this.addLocator} 
        />
      )
    }

    if (object && object.hasOwnProperty('locator') && this.state.editing) {
      return(
        <LocatorsChanger 
          moveLocator={this.moveLocator}
          startEdit={this.startEdit}
          selectedLocatorName={ selectedLocatorName }
          remove={ this.remove }
          editing={ this.state.editing }
          editStr={ this.state.editStr }
          addLocator={this.addLocator} 
          onChangeUpdate={ this.onChangeUpdate }
          finishEdit={ this.finishEditLocator }
        />
      )
    }

    return null;
  }

  renderInner() {
    const { object } = this.props;
    const { selectedLocatorName } = this.state;
    
    if(object && object.children && object.children.length) {
      return (
        <div className="list list-auto-height">
            { object.children.map( (itm, index) => 
              <div 
                className="list-item" 
                key={index}
              >
                <div 
                  className={`item-value-wrap ${itm.name === selectedLocatorName ? 'selected' : ''}`}
                  onClick={ () => { this.select(itm.name, index) } }
                  onDoubleClick={ () => { this.startEdit(itm.name) } }
                >
                  <p className="control">
                    {itm.name}
                  </p>
                </div>
              </div>
            ) }
        </div>
      );
    }

    if(object && object.children && object.children.length === 0) {
      return (
        <div className="list list-auto-height">
          <EmptyList />
        </div>
      );
    }

    if (!object && !object.hasOwnProperty('locator')) {
      return null;
    }
    // make sure to wrap the locator property in array if it's a string
    const locators = Array.isArray(object.locator) ? object.locator : [object.locator];

    return (
      <Fragment>
        <List 
          startEdit={ this.startEdit }
          deleteLocator={ this.props.deleteLocator }
          object= { object }
          data={ locators } 
          editable={ true } 
        />
      </Fragment>
    );
  }

  render() {
    return (
      <Fragment>
        { this.renderLocatorChanger() }
        <Panel 
          className="panel-full-height"
          noBodyPadding={ true }
          noBodyBorders={ true }
          scroller
          scrollWrapperClass="tree-wrapper tree-wrapper-half"
          scrollRefresh={ this.props.refreshScroll }
          scrollVerticalOnly
        >
          { this.renderInner() }
        </Panel>
      </Fragment>
    );
  }
}