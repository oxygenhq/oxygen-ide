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
import path from 'path';
import Tree from '../../components/Tree';
import Panel from '../../components/Panel.jsx';
import onSelectNode from './onSelectNode';
import renderTreeNodes from './renderTreeNodes';
import fsSubjects from '../../store/fs/subjects';
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
  rootPath: string | null
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
        if(this.props.rootPath !== nextProps.rootPath){
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
        if(this.props.unWatchFolder){
            this.props.unWatchFolder(folderPath);
        }
    }

    watchFolder = (folderPath) => {
        if(this.props.watchFolder){
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

    onSelectNode = (selectedKeys, info) => {
        onSelectNode.apply(this, [selectedKeys, info]);
    }


    onDrop = (info) => {
        let node;
        let dragNode;

        if(
            info &&
            info.node  &&
            info.node.props  &&
            info.node.props.nodeInfo
        ){
            node = info.node.props.nodeInfo;
        }
        
        if(
            info &&
            info.dragNode &&
            info.dragNode.props &&
            info.dragNode.props.nodeInfo
        ){
            dragNode = info.dragNode.props.nodeInfo;
        }


        if(node && dragNode && typeof node.type !=='undefined' && node.type !== 'file'){

            const oldPath = dragNode.path;
            const newPath = node.path + path.sep + dragNode.name;

            const safeOldPath = oldPath.endsWith(path.sep) ? oldPath : oldPath + path.sep;
            const safeNewPath = newPath.endsWith(path.sep) ? newPath : newPath + path.sep;
            
            if(safeOldPath !== safeNewPath){
                this.props.onMove(safeOldPath, safeNewPath);
            }
        } else {
            const { rootPath } = this.props;
            if(rootPath && dragNode){
                const oldPath = dragNode.path;
                const newPath = rootPath + path.sep + dragNode.name;

                const safeOldPath = oldPath.endsWith(path.sep) ? oldPath : oldPath + path.sep;
                const safeNewPath = newPath.endsWith(path.sep) ? newPath : newPath + path.sep;
                
                if(safeOldPath !== safeNewPath){
                    this.props.onMove(safeOldPath, safeNewPath);
                }
            }
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
        const { rootName, rootPath } = this.props;
        const { selectedKeys, refreshScroll, refreshScrollBottom } = this.state;
        const headerTitle = (
            <Tooltip title={(rootPath ? rootPath : '')}>
                <span>{'File Explorer' + (rootName ? ` - ${rootName}` : '')}</span>
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
                    showLine
                    draggable
                    checkable={false}
                    defaultExpandedKeys={['nonexistingkey']}
                    autoExpandParent
                    selectedKeys={selectedKeys}
                    rootPath={rootPath}
                    loadData={this.loadData}
                    unWatchFolder={this.unWatchFolder}
                    watchFolder={this.watchFolder}
                    onSelect={this.onSelectNode}
                    onDragStart={this.onDragStart}
                    onDragEnter={this.onDragEnter}
                    onDrop={this.onDrop}
                    doRefreshScrollBottom={this.doRefreshScrollBottom}
                    doRefreshScrollTop={this.doRefreshScrollTop}
                    wrap={this.wrap}
                >
                    {renderTreeNodes.apply(this, [this.props.treeData])}
                </Tree>
            </Panel>
        );
    }
}
/*

        <ScrollContainer
          refreshScroll={this.props.refreshScroll}
          disableHorizontal
          classes="tree-wrapper scroller"
        >
          {() => (
            <Tree
              showLine
              checkable={ false }
              defaultExpandedKeys={ ['nonexistingkey'] }
              autoExpandParent
              selectedKeys={ selectedKeys }
              loadData={ this.loadData }
              onSelect={ this.onSelectNode }
            >
              { renderTreeNodes.apply(this, [this.props.treeData]) }
            </Tree>
          )}
        </ScrollContainer>

              {renderTreeNodes(this.props.treeData, this.onSelectContexMenuItem)}
              onExpand={this.onExpandNode}
              selectedKeys={this.state.selectedKeys}
*/
