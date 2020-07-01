/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import Tree from '../components/Tree';
import React, { Fragment } from 'react';

function renderVariablesTreeNodes(nodes, parentIndex) {

    if (!nodes || !nodes.length || nodes.length == 0) {
        return null;
    }

    return nodes.map((element, idx) => {
        const resolveClassName = element.name === '.emptyfile' ? 'hidden-node' : element.type;
        
        let theTitle = (
            <Fragment>
                <span style={{color: '#0000ff'}}>{element.name}</span>
                {' '}
                :
                {' '}
                <span style={{color: '#a31515'}}>{'<'+element.type+'>'}</span>

                {
                    element && typeof element.value !== 'undefined' &&
                    ' '+element.value
                }
            </Fragment>
        );

        let saveParentIndex = '0';

        if (parentIndex) {
            saveParentIndex = parentIndex;
        }

        saveParentIndex+='.'+idx;
        
        if (element.children && element.children.length) {
            return (
                <Tree.TreeNode
                    hideIcon={true}
                    nodeInfo={element}
                    key={saveParentIndex}
                    title={theTitle}
                    className={resolveClassName}
                    dataRef={element}
                    style={{ userSelect: 'none' }}
                    isLeaf={false}
                >
                    {element.children ? renderVariablesTreeNodes.apply(this, [element.children, saveParentIndex]) : []}
                </Tree.TreeNode>
            );
        }

        return (
            <Tree.TreeNode
                hideIcon={true}
                nodeInfo={element}
                title={theTitle}
                key={idx}
                className={resolveClassName}
                dataRef={element}
                style={{ userSelect: 'none' }}
                isLeaf={true}
            />
        );
    });
}

export default renderVariablesTreeNodes;
