/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import Tree from '../../components/Tree';

function handleContextMenuEvent(e, node, menuName) {
  e.preventDefault();
  this.props.setActiveNode(node.path);
  this.props.showContextMenu(menuName, e);
}

function renderTreeNodes(nodes) {
    if (!nodes || !nodes.length || nodes.length === 0) {
        return null;
    }
    handleContextMenuEvent = handleContextMenuEvent.bind(this);
    return nodes.map(element => {
      const resolveClassName = element.name === '.emptyfile'
        ? 'hidden-node' : element.type;

      let theTitle = element.name;
      let onIconContextMenu = () => {};
      if (element.type === 'file' && element.name !== '.emptyfile') {
        theTitle = (
          <span 
            className="tree-row-title" 
            title={ element.name } 
            style={{ userSelect: 'none' }} 
            onContextMenu={ (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_FILE_EXPLORER_FILE') }
          >{element.name}</span>
        );
        onIconContextMenu = (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_FILE_EXPLORER_FILE');
      }
      else if (element.type === 'folder' && element.name !== '.emptyfile') {
        theTitle = (
          <span 
            className="tree-row-title" 
            title={ element.name } 
            style={{ userSelect: 'none' }} 
            onContextMenu={ (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_FILE_EXPLORER_FOLDER') }
          >{element.name}</span>
        );
        onIconContextMenu = (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_FILE_EXPLORER_FOLDER');
      }

      if (element.type === 'folder') { // && element.children && element.children.length > 0
        return (
          <Tree.TreeNode
            nodeInfo={element}
            key={element.path}
            onIconContextMenu={onIconContextMenu}
            title={theTitle}
            className={resolveClassName}
            dataRef={element}
            style={{ userSelect: 'none' }}
            isLeaf={false}
          >
            {element.children ? renderTreeNodes.apply(this, [element.children]) : []}
          </Tree.TreeNode>
        );
      }

      return (
        <Tree.TreeNode
          nodeInfo={element}
          onIconContextMenu={onIconContextMenu}
          title={theTitle}
          key={element.path}
          className={resolveClassName}
          dataRef={element}
          style={{ userSelect: 'none' }}
          isLeaf={true}
        />
      );
    });
  };

  export default renderTreeNodes;
