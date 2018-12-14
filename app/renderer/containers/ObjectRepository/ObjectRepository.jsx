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
import styled from '@emotion/styled';

import FlexColumn from '../../components/core/FlexColumn';
import Panel from '../../components/Panel';
import ScrollContainer from '../../components/ScrollContainer';
import ObjectTree from './ObjectTree';
import ObjectEditor from './ObjectEditor';

type Props = {
  tree: null | object,
  active: null | object,
};

export default class ObjectRepository extends PureComponent<Props> {
  props: Props;

  static Container = styled(FlexColumn)(props => ({
    height: '100vh',
    flexShrink: 0,
    padding: props.floating ? 10 : 0,
    //borderBottom: props.collapsed ? 'none' : BORDER,
  }));

  onSelectNode(path) {
    this.props.setActive(path);
  }

  render() {
      const { tree, active, name, selectedObject, setActive } = this.props;
      let repoPanelTitle = 'Repository';
      let editorPanelTitle = 'Object';
      if (name && name !== '') {
          repoPanelTitle += ` - ${name}`;
      }
      if (selectedObject && selectedObject.name !== '') {
        editorPanelTitle += ` - ${selectedObject.name}`;
      }
      console.log('selectedObject', selectedObject)
      return (
        <ObjectRepository.Container>
            <Panel header={ repoPanelTitle }
                scroller
                scrollWrapperClass="tree-wrapper"
                scrollRefresh={ this.props.refreshScroll }
                scrollVerticalOnly
            >
                <ObjectTree
                    tree={ tree }
                    active={ active }
                    onSelect={ (path) => setActive(path) }
                />
            </Panel>
            { selectedObject &&
            <Panel header={ editorPanelTitle } noBodyPadding={ true } >
                <ObjectEditor object={ selectedObject } />
            </Panel>
            }
        </ObjectRepository.Container>
      );    
  }
}
