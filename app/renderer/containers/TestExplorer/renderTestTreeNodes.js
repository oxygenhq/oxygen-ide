// @flow
import React, { Fragment } from 'react';
import Tree from '../../components/Tree';

const getSteps = (inputNodes, cid) => {
    const result = [];
    
    if (inputNodes && Array.isArray(inputNodes) && inputNodes.length > 0) {
        inputNodes.map((item) => {
            if (item.type === 'step' && item.cid === cid) {
                result.push(item);
            }
        });
    }
    return result;
};

const getCases = (inputNodes, sid) => {
    const result = [];
    
    if (inputNodes && Array.isArray(inputNodes) && inputNodes.length > 0) {
        inputNodes.map((item) => {
            if (item.type === 'case' && item.sid === sid) {
                const children = getSteps(inputNodes, item.cid);
                if (children) {
                    item.children = children;
                }
                result.push(item);
            }
        });
    }
    return result;
};

export const buildTree = (inputNodes) => {
    const result = [];


    if (inputNodes && Array.isArray(inputNodes) && inputNodes.length > 0) {
        inputNodes.map((item) => {
            if (item.type === 'suite') {
                const children = getCases(inputNodes, item.sid);
                if (children) {
                    item.children = children;
                }
                result.push(item);
            }
        });
    }

    return result;
};

export const groupNodes = (inputNodes) => {
    const result = [];
    if (inputNodes && Array.isArray(inputNodes) && inputNodes.length > 0) {
        inputNodes.map((item) => {
            if (item && item.type === 'SUITE_STARTED') {
                if (item.suite && item.suite.sid) {
                    const endItem = inputNodes.find((i) => i.result && i.result.sid === item.suite.sid && i.type === 'SUITE_ENDED' );
                    let node;
                    if (endItem) {
                        node = endItem.result;
                    } else {
                        node = item.suite;
                    }
                    node.type = 'suite';
                    result.push(node);
                }
            }

            if (item && item.type === 'CASE_STARTED') {
                if (item.case && item.case.cid) {
                    const endItem = inputNodes.find((i) => i.result && i.result.cid === item.case.cid && i.type === 'CASE_ENDED' );
  
                    let node;
                    if (endItem) {
                        node = endItem.result;
                    } else {
                        node = item.case;
                    }
                    node.type = 'case';
                    result.push(node);
                }
            }

            if (item && item.type === 'STEP_STARTED') {
                if (item.step && item.step.sid) {
                    const endItem = inputNodes.find((i) => i.result && i.result.sid === item.step.sid && i.type === 'STEP_ENDED' );
                    let node;
                    if (endItem) {
                        node = endItem.result;
                    } else {
                        node = item.step;
                    }
                    node.type = 'step';
                    result.push(node);
                }
            }
        });
    }

    return result;
};

export function renderTestTreeNodes(nodes, parentIndex) {
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
                    {element.children ? renderTestTreeNodes.apply(this, [element.children, saveParentIndex]) : []}
                </Tree.TreeNode>
            );
        }

        return (
            <Tree.TreeNode
                hideIcon={true}
                nodeInfo={element}
                title={theTitle}
                key={saveParentIndex}
                className={resolveClassName}
                dataRef={element}
                style={{ userSelect: 'none' }}
                isLeaf={true}
            />
        );
    });
}