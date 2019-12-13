/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React from 'react';
import Tree from '../../components/Tree';

import renderTreeNodes from './renderTreeNodes';

type Props = {
  tree: null | object,
  active: null | object,
  onSelect: Function,
  searchResults: Array
};

export default class ObjectTree extends React.PureComponent<Props> {
  props: Props;

  state = {
      selectedKeys: [],
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.active !== nextProps.active) {
          if (!nextProps.active) {
              this.setState({
                  selectedKeys: [],
              });
          }
          else {
              this.setState({
                  selectedKeys: [nextProps.active],
              });
          }
      }
  }

  handleSelectNode = (selectedKeys, info) => {
      const { nodeInfo } = info.node.props;
      this.props.onSelect(nodeInfo.path);
  }

  render() {
      const { tree, searchResults } = this.props;
      const { selectedKeys } = this.state;
    
      return (
          <Tree
              showLine
              checkable={ false }              
              defaultExpandedKeys={ ['nonexistingkey'] }
              autoExpandParent
              selectedKeys={ selectedKeys }
              onSelect={ this.handleSelectNode }
          >
              { renderTreeNodes.apply(this, [tree, searchResults]) }
          </Tree>
      );
  }
}