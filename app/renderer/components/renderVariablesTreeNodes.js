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
                :
                {' '}
                {
                    generatePreviewTextForVariableValue(element.value)
                }
            </Fragment>
        );
        //                <span style={{color: '#a31515'}}>{'<'+element.type+'>'}</span>
        /*
         && typeof element.value !== 'undefined' &&
                    ' '+element.value
        */

        let saveParentIndex = '0';

        if (parentIndex) {
            saveParentIndex = parentIndex;
        }

        saveParentIndex+='.'+idx;
        if (element.value && typeof element.value === 'object') {
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
                    { renderVariablesTreeNodes.apply(this, [generateVariablesListFromObjectProperties(element.value), saveParentIndex]) }
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

function generateVariablesListFromObjectProperties(obj) {
    if (typeof obj !== 'object') {
        return [];
    }
    const variableList = [];
    Object.keys(obj).forEach(key => {
        const value = obj[key];
        const type = typeof value;
        // ignore empty objects (originally, those were functions that were serialized by Oxygen into empty objects)
        if (type === 'object' && Object.keys(value).length == 0) {
            return;
        }
        variableList.push({
            name: key,
            type: type,
            value,
        });
    });
    return variableList;
}

function generatePreviewTextForVariableValue(value) {
    if (typeof value === 'undefined') {
        return 'undefined';
    }
    if (value === null) {
        return 'null';
    }
    if (typeof value === 'string') {
        return `"${value}"`;
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
        return value + '';
    }
    if (typeof value === 'boolean') {
        return value.toString();
    }
    if (typeof value === 'object') {
        return JSON.stringify(value);
    }
    return '';
}

export default renderVariablesTreeNodes;
