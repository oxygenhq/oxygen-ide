/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { Fragment } from 'react';
import PerfectScrollbar from 'perfect-scrollbar';
import { DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import { Icon, Tooltip, Modal, Button } from 'antd';
import debounce from 'lodash/debounce';
import 'perfect-scrollbar/css/perfect-scrollbar.css';
import DraggableTab from './DraggableTab.jsx';
import '../../css/tabs.scss';

type Props = {
    sidebarCollapsed: boolean | undefined,
    active: null | string,
    tabs: Array,
    onChange: (string) => void,
    onClose: (string) => void,
    changeTabOrder: Function,
    recorder: Object,
    activeTitle: string | null
};

const circle = () => {
    return (
        <svg height="14" width="14">
            <circle cx="7" cy="7" r="5" fill="lightblue" />
        </svg>
    );
};

class Tabs extends React.Component<Props, void> {
    state = {
        closeTabAsk: false
    }

  componentDidMount() {
      if(this.tabsRef){
          this.ps = new PerfectScrollbar(this.tabsRef, {
              suppressScrollY: true,
              useBothWheelAxes: true,
          });
      }

      window.addEventListener('resize', debounce((e) => {
          e.preventDefault();
          if (this.ps) {
              this.ps.destroy();
              if(this.tabsRef){
                  this.ps = new PerfectScrollbar(this.tabsRef, {
                      suppressScrollY: true,
                      useBothWheelAxes: true,
                  });
              }
          } else {
              if(this.tabsRef){
                  this.ps = new PerfectScrollbar(this.tabsRef, {
                      suppressScrollY: true,
                      useBothWheelAxes: true,
                  });
              }
          }
      }, 150), false);
  }

  // nextProps, nextState
  UNSAFE_componentWillUpdate(nextProps) {
      const { sidebarCollapsed, tabs } = this.props;
      if (this.ps) {
          if (nextProps.sidebarCollapsed !== sidebarCollapsed) {
              this.ps.update();
          }
          if (nextProps.tabs.length !== tabs.length) {
              this.ps.update();
          }
      }
  }

  // holds PerfectScrollbar instance
  ps = null

  changeTabOrder = (dragIndex, hoverIndex) => {
      this.props.changeTabOrder(dragIndex, hoverIndex);
  }

  render() {
      const { active, tabs, recorder, activeTitle } = this.props;
      let activeTab;

      if(active === 'unknown'){
          activeTab = active ? tabs.find(x => x.key === active && x.title === activeTitle) : null;
      } else {
          activeTab = active ? tabs.find(x => x.key === active) : null;
      }
    
      let confirmFooter = [
          <Button key="close-without-saving" onClick={this.onCloseWithoutConfirm}>Close without saving</Button>,
          <Button key="just-cancel" type="danger" onClick={this.onCancelClose}>Cancel</Button>,
      ];
      if (activeTab && !activeTab.key.includes('unknown')) {
          confirmFooter = [
              <Button key="save-n-close" type="primary" onClick={this.onSaveAndClose}>
          Save and close
              </Button>,
              ...confirmFooter
          ];
      }

      return (
          <Fragment>
              <Modal
                  title="Confirm your actions"
                  okText="Don`t save"
                  cancelText="Cancel"
                  visible={this.state.closeTabAsk}
                  onCancel={this.onCancelClose}
                  footer={confirmFooter}
              >
                  <p>Are you sure, you want to close unsaved tab?</p>
              </Modal>

              <div
                  className="tabs-bar-wrapper"
                  ref={theRef => { this.tabsRef = theRef; }}
              >

                  {tabs.length > 0 && (
                      tabs.map((tab, index) => {
    
                          let itemClass = activeTab && activeTab.key === tab.key && activeTab.title === tab.title ?
                              'tabItemElem activeTabitem' : 'tabItemElem';

                          const { isRecording, activeFile, activeFileName } = recorder;

                          if(isRecording){
                              if(activeFile === 'unknown'){
                                  if(activeFile === tab.key && activeFileName === tab.title){
                                      itemClass += ' green-bg';
                                  }
                              } else if(activeFile === tab.key){
                                  itemClass += ' green-bg';
                              }
                          }

                          return (
                              <DraggableTab
                                  id={tab.key}
                                  index={index}
                                  key={tab.key+tab.title}
                                  moveCard={this.changeTabOrder}
                              >
                                  <div className={itemClass}>
                                      <Tooltip
                                          mouseEnterDelay={0.5}
                                          placement="top"
                                          title={tab.key}
                                      >
                                          <button onClick={() => this.props.onChange(tab.key, tab.title)}>
                                              {tabs.length < 6 && <Icon type="file" />}
                                              <span style={{ marginLeft: 5 }}>{tab.title}</span>
                                          </button>
                                      </Tooltip>

                                      { tab.touched &&
                    <Icon
                        className="close-icon"
                        onClick={() => this.props.onClose && this.props.onClose(tab.key, tab.title)}
                        component={circle}
                    />
                                      }
                                      { !tab.touched &&
                    <Icon
                        className="close-icon"
                        onClick={() => this.props.onClose && this.props.onClose(tab.key, tab.title)}
                        type={'close'}
                    />
                                      }
                                  </div>
                              </DraggableTab>
                          );
                      })
                  )}
              </div>
          </Fragment>
      );
  }
}

export default DragDropContext(HTML5Backend)(Tabs);
