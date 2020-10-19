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
import fsSubjects from '../../store/fs/subjects';
import { renderTestTreeNodes, groupNodes, buildTree } from './renderTestTreeNodes';
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
  testEvents: Array
};

export default class FileExplorer extends React.Component<Props> {
    constructor(props: Props) {
        super(props);
        this.wrap = React.createRef();
        // keeps path hash of nodes which children loading is in progress
        this.loadingNodes = {};
        // keeps reference to Rxjs subscriptions
        this.subscriptions = [];

        this.loadData = this.loadData.bind(this);
        this.onSubjectChildrenLoaded = this.onSubjectChildrenLoaded.bind(this);
        // subscribe to relevant subjects
        this.subscriptions['FILE.CHILDREN.LOADED'] = fsSubjects['FILE.CHILDREN.LOADED'].subscribe(this.onSubjectChildrenLoaded);
        // set initial selectedKeys value
        let selectedKeys = [];
        if (this.props.activeNodePath) {
            selectedKeys = [this.props.activeNodePath];
        }
        this.state = {
            selectedKeys,
            refreshScroll: false,
            refreshScrollBottom: false
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps) {
        if (this.props.rootPath !== nextProps.rootPath) {
            this.doRefreshScrollTop();
        }

        if (this.props.activeNodePath !== nextProps.activeNodePath) {
            if (!nextProps.activeNodePath) {
                this.setState({
                    selectedKeys: [],
                });
            } else {
                this.setState({
                    selectedKeys: [nextProps.activeNodePath],
                });
            }
        }
    }

    componentWillUnmount() {
        if (this.subscriptions['FILE.CHILDREN.LOADED']) {
            this.subscriptions['FILE.CHILDREN.LOADED'].unsubscribe();
        }
    }

    loadData = (treeNode) => new Promise((resolve, reject) => {
        const nodeData = treeNode.props.nodeInfo;
        // add current node and promise functions to a loadingNodes list
        if (this.loadingNodes.hasOwnProperty(treeNode.path)) {
            reject("This node's children are currently being loaded.");
        }
        this.loadingNodes[nodeData.path] = {
            id: nodeData.path,
            node: nodeData,
            resolve: resolve,
            reject: reject,
        };
        this.props.treeLoadNodeChildren(nodeData, true);
    })

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

    onSubjectChildrenLoaded = (e) => {
        if (this.loadingNodes.hasOwnProperty(e.path)) {
            const loadingState = this.loadingNodes[e.path];
            delete this.loadingNodes[e.path];
            loadingState.resolve();
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

    render() {
        const { refreshScroll, refreshScrollBottom } = this.state;
        const { testEvents } = this.props;
        const headerTitle = (
            <Tooltip title={'Test Explorer'}>
                <span>{'Test Explorer'}</span>
            </Tooltip>
        );
        let nodes = groupNodes(testEvents);
        nodes = buildTree(nodes);

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
                    showLine
                    draggable
                    checkable={false}
                    autoExpandParent
                >
                    { renderTestTreeNodes.apply(this, [nodes]) }
                </Tree>
            </Panel>
        );
    }
}