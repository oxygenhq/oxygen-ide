/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import Tree from '../../components/Tree';
import React from 'react';

const checkHighLightChild = (arr, searchResults) => {
  return arr.some(item => {
    return (searchResults.indexOf(item.name) > -1 || item.type === "container" && checkHighLightChild(item.children, searchResults));
  })
}

function handleContextMenuEvent(e, node, menuName) {
  e.preventDefault();
  if(this.props.setActiveNode){
    this.props.setActiveNode(node.path);
  }
  if(this.props.showContextMenu){

    let safeNode = null;

    if(node){
      safeNode = node;
    }

    this.props.showContextMenu(menuName, e, safeNode);
  }
}

function renderTreeNodes(nodes, searchResults) {
    const { active } = this.props;

    if (!nodes || !nodes.length || nodes.length == 0) {
      return null;
    }
    handleContextMenuEvent = handleContextMenuEvent.bind(this);
    return nodes.map(element => {
            const resolveClassName = element.name === '.emptyfile'
        ? 'hidden-node' : element.type;

      let theTitle = element.name;  
      let highLight = false;

      if (searchResults.indexOf(theTitle) > -1) {
        highLight = true;
      }
      const highLightStyle = highLight ? { backgroundColor: 'yellow' } :  {};

      if (element.type === 'object') {
        theTitle = (
          <span 
            className="nodeText"
            title={ element.name } 
            style={{ userSelect: 'none', ...highLightStyle }} 
          >{element.name}</span>
        );
      }
      else if (element.type === 'container') {
        theTitle = (
          <span 
            className="nodeText"
            title={ element.name } 
            style={{ userSelect: 'none', ...highLightStyle }} 
          >{element.name}</span>
        );
      }

      if (element.type === 'container') {
        let highLightChild = false;

        if(element.children && element.children.length){
          const checkedHighLightChild = checkHighLightChild(element.children, searchResults);
          if(checkedHighLightChild){
            highLightChild = true;
          }
        }
        return (
          <Tree.TreeNode
            nodeInfo={element}
            key={element.path}
            title={theTitle}
            className={resolveClassName}
            dataRef={element}
            style={{ userSelect: 'none' }}
            isLeaf={false}
            highLightChild={highLightChild}
            onContextMenuHendler={ (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_CONTAINER') }
          >
            {element.children ? renderTreeNodes.apply(this, [element.children, searchResults]) : []}
          </Tree.TreeNode>
        );
      }

      return (
        <Tree.TreeNode
          nodeInfo={element}
          title={theTitle}
          key={element.path}
          className={resolveClassName}
          dataRef={element}
          style={{ userSelect: 'none' }}
          isLeaf={true}
          onContextMenuHendler={ (e) => handleContextMenuEvent(e, element, 'CONTEXT_MENU_OBJECT_REPOSITORY_EDITOR_ELEMENT') }
        />
      );
    });
  };

  export default renderTreeNodes;
