/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
/* eslint-disable react/no-unused-state */
import { Spin, Icon, Select, Input, message } from 'antd';
import React, { Component } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/lib/fa';
import {
  MdUndo,
  MdRedo,
  MdContentCut,
  MdContentPaste,
} from 'react-icons/lib/md';

import '../../css/toolbar.scss';

import * as Controls from './controls';
import NoChromeDialog from './NoChromeDialog';
import WorkingChromeDialog from './WorkingChromeDialog';
import { type DeviceInfo } from '../../types/DeviceInfo';
import { type BrowserInfo } from '../../types/BrowserInfo';

type ControlState = {
  visible?: boolean,
  enabled?: boolean
};
type Props = {
  stepDelay: number,
  testMode: string,
  testTarget?: ?string,
  browsers: Array<BrowserInfo>,
  devices: Array<DeviceInfo>,
  emulators: Array<string>,
  controlsState: { [string]: ControlState },
  onValueChange: (string, string) => void,
  onButtonClick: (string) => void
};

const { Option } = Select;

export default class Toolbar extends Component<Props> {
  constructor(props){
    super(props);
    this.state = {
      canRecord: false,
      showWorkingChromeDialog: false,
      checkExtension: false
    }
  }

  componentWillUnmount() {
    if(this.state.intervalId){
      clearInterval(this.state.intervalId);
    }
  }

  checkExtension = () => {
    var intervalId = setInterval(this.timer, 2000);
    this.setState({
      intervalId: intervalId,
      checkExtension: true,
    });
  }

  timer = () => {
    const { 
      isChromeExtensionEnabled, 
      waitChromeExtension,
      stopWaitChromeExtension
    } = this.props;

    let newState = {};

    if(Number.isInteger(isChromeExtensionEnabled)){
      const now = Date.now();
      const diff = now - isChromeExtensionEnabled;

      if(diff && diff > 2000){
        newState.canRecord = false;      
      } else {
        newState.canRecord = true;
      }

      if(newState.canRecord !== this.state.canRecord){
        this.setState(newState);
      }
    } else {
      // if(typeof this.state.showNoChromeDialog === 'undefined'){
      //   newState.showNoChromeDialog = true;
      //   this.setState(newState);
      // }
    }

    if(waitChromeExtension){
      // extension not finded
      if(stopWaitChromeExtension){
        this.setState({
          checkExtension: false
        }, () => {
          stopWaitChromeExtension();
        });
      }
    }
  }

  hideNoChromeDialog = () => {
    this.setState({
      showNoChromeDialog: false
    });
  }

  hideWorkingChromeDialog = () => {
    this.setState({
      showWorkingChromeDialog: false
    });
  }

  handleClickEvent(ctrlId) {
    if (this._isEnabled(ctrlId) && this._isVisible(ctrlId) && this.props.onButtonClick) {
      this.props.onButtonClick(ctrlId);
    }
  }

  handleValueChange(ctrlId, value) {
    if (this.props.onValueChange) {
      this.props.onValueChange(ctrlId, value);
    }
  }

  _isEnabled(ctrlId) {
    const state = this.props.controlsState ? this.props.controlsState[ctrlId] : null;
    if (state && state.hasOwnProperty('enabled')) {
      return state.enabled;
    }
    return true;
  }

  _isVisible(ctrlId) {
    const state = this.props.controlsState ? this.props.controlsState[ctrlId] : null;
    if (state && state.hasOwnProperty('visible')) {
      return state.visible;
    }
    return true;
  }

  _isSelected(ctrlId) {
    const state = this.props.controlsState ? this.props.controlsState[ctrlId] : null;
    if (state && state.hasOwnProperty('selected')) {
      return state.selected;
    }
    return true;
  }

  _getControlClassNames(ctrlId, additionalClass) {
    // add additional class name, if specified
    let classNames = additionalClass ? `control ${additionalClass}` : 'control';
    const enabled = this._isEnabled(ctrlId);
    if (!enabled) {
      classNames += `${classNames} disabled`;
    }
    return classNames;
  }

  showNotWorkingOxygenExtensionModal = () => {
    this.setState({
      showNoChromeDialog: true
    });
  }

  showWorkingOxygenExtensionModal = () => {
    this.setState({
      showWorkingChromeDialog: true
    }, () => {
      this.handleClickEvent(Controls.TEST_RECORD);
    });
  }

  render() {
    const {
      testMode, 
      testTarget, 
      devices, 
      browsers, 
      emulators, 
      stepDelay,
      isChromeExtensionEnabled,
      waitChromeExtension,
      showRecorderMessage,
      changeShowRecorderMessageValue
    } = this.props;

    const { 
      canRecord,
      showNoChromeDialog,
      showWorkingChromeDialog,
      checkExtension
    } = this.state;
    return (
      <div className="appTollbar">
        { typeof showNoChromeDialog !== 'undefined' && showNoChromeDialog && 
          <NoChromeDialog hide={this.hideNoChromeDialog}/>
        }

        { showWorkingChromeDialog && this._isSelected(Controls.TEST_RECORD) &&
          <WorkingChromeDialog 
            changeShowRecorderMessageValue={changeShowRecorderMessageValue}
            showRecorderMessage={showRecorderMessage}
            hide={this.hideWorkingChromeDialog}
          />
        }

        { this._isVisible(Controls.NEW_FILE) && (
          <Icon
            className="control button"
            style={ getOpacity(this._isEnabled(Controls.NEW_FILE)) }
            onClick={ () => ::this.handleClickEvent(Controls.NEW_FILE) }
            type="file-add"
            title="New File"
          />
        )}

        <Icon
          className="control button"
          onClick={ () => ::this.handleClickEvent(Controls.OPEN_FOLDER) }
          type="folder-open"
          title="Open Folder"
          style={ {'fontSize': '25px'} }
        />

        <Icon
          className="control button"
          onClick={ () => ::this.handleClickEvent(Controls.SAVE_FILE) }
          title="Save"
          type="save"
        />

        <div className="separator" />
        <span className={testMode === 'web' ? 'control selectable active' : 'control selectable'}>
          <Icon
            style={ getOpacity(this._isEnabled(Controls.TEST_MODE_WEB)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_MODE_WEB) }
            style={{ marginRight: 0 }}
            title="Web Mode"
            type="global"
          />
        </span>

        <span className={testMode === 'mob' ? 'control selectable active' : 'control selectable'}>
          <Icon
            style={ getOpacity(this._isEnabled(Controls.TEST_MODE_MOB)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_MODE_MOB) }
            style={{ marginRight: 0 }}
            title="Mobile Mode"
            type="mobile"
          />
        </span>

        <span className={testMode === 'resp' ? 'control selectable active' : 'control selectable'}>
          <Icon
            style={ getOpacity(this._isEnabled(Controls.TEST_MODE_RESP)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_MODE_RESP) }
            style={{ marginRight: 0 }}
            title="Responsive Mode"
            type="scan"
          />
        </span>

        <Select
          className="control select"
          value={this.props.testTarget}
          style={{ width: 170 }}
          onChange={ (value) => ::this.handleValueChange(Controls.TEST_TARGET, value) }
        >
          {
            testMode === 'web' && browsers.map((browser) => (
              <Option key={ browser.id } value={ browser.id }>
                { browser.name }
              </Option>
            ))
          }
          {
            testMode === 'mob' && devices.map((device) => (
              <Option key={ device.id } value={ device.id }>
                { device.name }
              </Option>
            ))
          }

          {
            testMode === 'resp' && emulators.map((emulator) => (
              <Option key={emulator} value={emulator}>
                {emulator}
              </Option>
            ))
          }
        </Select>

        <div className="separator" />

        {/* RUN part */}
        { this._isVisible(Controls.TEST_RUN) && (
          <button
            onClick={ () => ::this.handleClickEvent(Controls.TEST_RUN) }
            className={ this._getControlClassNames(Controls.TEST_RUN, 'button') }
            disabled={ !this._isEnabled(Controls.TEST_RUN) }
          >
            <Icon
              title="Run Test"
              type="play-circle"
              theme="filled"
            /> <span>Run</span>
          </button>
        )}

        { this._isVisible(Controls.TEST_CONTINUE) && (
          <Icon
            className="control button"
            style={ getOpacity(this._isEnabled(Controls.TEST_CONTINUE)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_CONTINUE) }
            type="forward"
            title="Continue"
          />
        )}

        { this._isVisible(Controls.TEST_STOP) && (
          <button
            className="control button stop"
            style={ getOpacity(this._isEnabled(Controls.TEST_STOP)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_STOP) }
            title="Stop"
          >
            <Icon
              title="Terminate Test"
              type="close-circle"
              theme="filled"
            /> 
            <span>Stop</span>
          </button>
        )}

        <div className="separator" />

        <label className="control label" htmlFor="stepDelay">Delay</label>
        <Input
          id="stepDelay"
          className="control input"
          type="number"
          value={ stepDelay }
          max={ 99 }
          style={{ width: 55, caretColor: 'transparent' }}
          onKeyPress={ (e) => e.preventDefault() }
          onChange={ (e) => ::this.handleValueChange(Controls.TEST_STEP_DELAY, e.target.value) }
        />

        <div className="separator" />

        { /* waitChromeExtension &&
          <span style={{marginLeft:'10px'}}>
            <Spin indicator={<Icon type="loading" style={{ fontSize: 24 }} spin />} />
            <span className="ext-wait-message">Waiting for extension</span>
          </span>
           */
        }
        { checkExtension &&
          <span
            style={ getOpacity(false) }
            className={ 'control selectable loader-wrap' }
            title="Conecting to chrome extension"
          >
            <FaMicrophone
              style={{ marginRight: 0 }}
            />
            <Spin indicator={<Icon type="loading" className="loader-wrap-inner" spin />}/>
          </span>
        }
        { !checkExtension && waitChromeExtension &&
          <span
            onClick={ this.checkExtension }
            style={ getOpacity(false) }
            className={ this._isSelected(Controls.TEST_RECORD) ? 'control selectable active' : 'control selectable' }
            title="Record"
          >
            <FaMicrophone
              style={{ marginRight: 0 }}
            />
          </span>
        }

        { !checkExtension && !waitChromeExtension && !canRecord && 
          <span
            className={ this._isSelected(Controls.TEST_RECORD) ? 'control selectable not-work active' : 'control selectable not-work' }
            title="Chrome extension not finded"
          >
            <FaMicrophoneSlash
              style={{ marginRight: 0 }}
              onClick={ this.showNotWorkingOxygenExtensionModal }
            />
          </span>}

        { !checkExtension && !waitChromeExtension && canRecord &&
          <span
            className={ this._isSelected(Controls.TEST_RECORD) ? 'control selectable active' : 'control selectable' }
            title="Record"
          >
            <FaMicrophone
              style={{ marginRight: 0 }}
              onClick={ this.showWorkingOxygenExtensionModal }
            />
          </span>
        }

        <span 
          className={ this._isSelected(Controls.TEST_SETTINGS) ? 'control selectable active' : 'control selectable' }
          style={{ marginLeft: 'auto' }}
        >
          <Icon
            style={ getOpacity(this._isEnabled(Controls.TEST_SETTINGS)) }
            onClick={ () => ::this.handleClickEvent(Controls.TEST_SETTINGS) }
            type="setting"
            title="Test Settings"
          />
        </span>
      </div>
    );
  }
}

function getOpacity(enabled) {
  return { opacity: (enabled ? 1 : 0.5) };
}
