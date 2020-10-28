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
import { Tooltip } from 'antd';
import Tree from '../../components/Tree';
import Panel from '../../components/Panel.jsx';
import { renderTestTreeNodes } from './renderTestTreeNodes';
import '../../components/Tree/assets/index.css';

type Props = {
  refreshScroll: boolean,
  treeData: Array<mixed> | undefined,
  activeNodePath: Array<mixed> | undefined,
  rootName: string | null,
  treeLoadNodeChildren: Function,
  unWatchFolder: Function,
  watchFolder: Function,
  onMove: Function,
  rootPath: string | null,
  testEvents: Array,
  testEventsNodes: Array,
  setSelected: Function,
  setNodeInTreeSelected: Function,
  testSelected: Object
};

const CASE_START = 'case.';
const SUITE_START = 'suite.';
const STEP_START = 'step.';

const getSelectedAndExpandedFromData = (testEventsNodes, inputSelectedKeys = [], inputExpandedKeys = [], testSelected = null) => {
    let selectedKeys = inputSelectedKeys;
    let expandedKeys = inputExpandedKeys;

    if (!Array.isArray(selectedKeys)) {
        selectedKeys = [];
    }
    if (!Array.isArray(expandedKeys)) {
        expandedKeys = [];
    }

    let selectedNode;
    if (testSelected) {
        selectedNode = testSelected.type+'.'+testSelected.id;
        selectedKeys = [selectedNode];
    }

    if (testEventsNodes && Array.isArray(testEventsNodes) && testEventsNodes.length > 0) {
        testEventsNodes.map((item) => {
            if (item.type === 'suite') {
                if (selectedNode && selectedNode.startsWith(SUITE_START)) {
                    selectedNode = selectedNode.replace(SUITE_START, '');
                }

                if (item.children) {
                    const rt = getSelectedAndExpandedFromData(item.children, inputSelectedKeys, inputExpandedKeys, testSelected);

                    if (rt.expandedKeys) {
                        rt.expandedKeys.map((item) => {
                            if (expandedKeys.includes(item)) {
                                // ignore
                            } else {
                                expandedKeys.push(item);
                            }
                        });
                    }
                }
            } else if (item.type === 'case') {
                if (selectedNode && selectedNode.startsWith(CASE_START)) {
                    selectedNode = selectedNode.replace(CASE_START, '');

                    if (item.cid === selectedNode) {
                        if (expandedKeys.includes(SUITE_START+item.sid)) {
                            //ignore
                        } else {
                            expandedKeys.push(SUITE_START+item.sid);
                        }
                    }
                }

                if (item.children) {
                    const rt = getSelectedAndExpandedFromData(item.children, inputSelectedKeys, inputExpandedKeys, testSelected);

                    if (rt.expandedKeys) {
                        rt.expandedKeys.map((item) => {
                            if (expandedKeys.includes(item)) {
                                // ignore
                            } else {
                                expandedKeys.push(item);
                            }
                        });
                    }
                }
            } else if (item.type === 'step') {
                if (selectedNode && selectedNode.startsWith(STEP_START)) {
                    selectedNode = selectedNode.replace(STEP_START, '');
                    
                    if (item.sid === selectedNode) {
                        if (expandedKeys.includes(CASE_START+item.cid)) {
                            //ignore
                        } else {
                            expandedKeys.push(CASE_START+item.cid);
                        }
                    }
                }
            }
        });
    }
    
    return {
        selectedKeys, expandedKeys
    };
};

const getSelectedAndExpandedKeys = (testEventsNodes, newSelectedKeys = null, newExpandedKeys = null, testSelected = null) => {
    let selectedKeys = newSelectedKeys;
    let expandedKeys = newExpandedKeys;
    
    const result = getSelectedAndExpandedFromData(testEventsNodes, selectedKeys, expandedKeys, testSelected);
    if (result) {
        selectedKeys = result.selectedKeys;
        expandedKeys = result.expandedKeys;
    }
    
    const returnResult = {
        selectedKeys: selectedKeys,
        expandedKeys: expandedKeys
    };
    return returnResult;
};

export default class TestExplorer extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
        this.wrap = React.createRef();
        // keeps path hash of nodes which children loading is in progress
        this.loadingNodes = {};
        // keeps reference to Rxjs subscriptions
        this.subscriptions = [];

        // set initial selectedKeys value
        let selectedKeys = [];
        if (this.props.activeNodePath) {
            selectedKeys = [this.props.activeNodePath];
        }
        this.state = {
            keys: null,
            selectedKeys,
            refreshScroll: false,
            refreshScrollBottom: false
        };
    }

    static getDerivedStateFromProps(props, prevState) {
        if (props.testEventsNodes && Array.isArray(props.testEventsNodes) && props.testEventsNodes.length > 0) {
            const newState = {
                ...prevState,
                keys: getSelectedAndExpandedKeys(props.testEventsNodes, prevState.keys && prevState.keys.selectedKeys || null, prevState.keys && prevState.keys.expandedKeys || null, props.testSelected)
            };
      
            return newState;
        } else {
            return null;
        }
    }

    componentDidUpdate(prevProps, prevState) {
        if (
            this.props.testEvents && Array.isArray(this.props.testEvents) && this.props.testEvents.length > 0 &&
            prevProps.testEvents && Array.isArray(prevProps.testEvents) && prevProps.testEvents.length > 0 &&
            this.props.testEvents.length > prevProps.testEvents.length &&
            this.props.testEvents.length !== prevProps.testEvents.length
        ) {
            const currentNode = this.props.testEvents[this.props.testEvents.length-1];

            if (currentNode) {
                let type;
                let id;
                if (currentNode.result) {
                    if (currentNode.type === 'CASE_ENDED') {
                        type = 'case';
                        id = currentNode.result.cid;
                    }
                    
                    if (currentNode.type === 'SUITE_ENDED') {
                        type = 'suite';
                        id = currentNode.result.sid;
                    }

                    if (currentNode.type === 'STEP_ENDED') {
                        type = 'step';
                        id = currentNode.result.sid;
                    }
                }

                if (currentNode.suite) {
                    type = currentNode.suite.type;
                    id = currentNode.suite.sid;
                }

                if (currentNode.case) {
                    type = currentNode.case.type;
                    id = currentNode.case.cid;
                }
        
                if (currentNode.step) {
                    type = currentNode.step.type;
                    id = currentNode.step.sid;
                }

                if (type && id) {
                    this.props.setNodeInTreeSelected(type, id);
                }
            }
        }
    }

    componentWillUnmount() {
        if (this.subscriptions['FILE.CHILDREN.LOADED']) {
            this.subscriptions['FILE.CHILDREN.LOADED'].unsubscribe();
        }
    }

    unWatchFolder = (folderPath) => {
        if (this.props.unWatchFolder) {
            this.props.unWatchFolder(folderPath);
        }
    }

    watchFolder = (folderPath) => {
        if (this.props.watchFolder) {
            this.props.watchFolder(folderPath);
        }
    }

    doRefreshScrollBottom = () => {
        this.setState({
            refreshScrollBottom: !this.state.refreshScrollBottom
        });
    }

    doRefreshScrollTop = () => {
        this.setState({
            refreshScroll: !this.state.refreshScroll
        });
    }

    onSelectNode = (selectedKeys, node, expandedKeys) => {
        const { nodeInfo } = node.node.props;

        delete nodeInfo.children;

        const type = nodeInfo.type;
        let id;

        if (type === 'case') {
            id = nodeInfo.cid;
        } else {
            id = nodeInfo.sid;
        }

        this.props.setSelected(type, id);
    }

    onExpand = (node, expanded) => {
        const { testEventsNodes, testSelected } = this.props;
        const newState = {
            ...this.state,
            keys: getSelectedAndExpandedKeys(testEventsNodes, expanded.selectedKeys, expanded.expandedKeys, testSelected)
        };
        this.setState(newState);
    }

    render() {
        const { refreshScroll, refreshScrollBottom, keys } = this.state;
        const { testEventsNodes } = this.props;
        const headerTitle = (
            <Tooltip title={'Test Debugger'}>
                <span>{'Test Debugger'}</span>
            </Tooltip>
        );

        return (
            <Panel
                wrapRef={this.wrap}
                header={headerTitle}
                scroller
                scrollWrapperClass="tree-wrapper"
                refreshScrollBottom={refreshScrollBottom}
                scrollRefresh={refreshScroll}
                scrollVerticalOnly
            >
                <Tree
                    {...keys}
                    showLine
                    checkable={false}
                    autoExpandParent
                    onSelect={this.onSelectNode}
                    onExpand={this.onExpand}
                >
                    { renderTestTreeNodes.apply(this, [testEventsNodes]) }
                </Tree>
            </Panel>
        );
    }
}