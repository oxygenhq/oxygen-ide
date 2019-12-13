/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { Fragment } from 'react';
import styled from '@emotion/styled';
import { Icon } from 'antd';

import FlexColumn from '../../components/core/FlexColumn';
import Panel from '../../components/Panel.jsx';
import ObjectTree from './ObjectTree.jsx';
import SearchRow from './SearchRow.jsx';
import ObjectEditor from './ObjectEditor.jsx';
import AddToRootRow from './AddToRootRow';

type Props = {
    tree: null | object,
    active: null | object,
    setActive: Function,
    closeActive: Function,
    clearObjectRepositoryFile: Function,
    name: string,
    selectedObject: Object | null,
    orAddToRoot: Function,
    refreshScroll: Function | undefined,
    showContextMenu: Function,
    addLocator: Function,
    addArrayObjectLocator: Function,
    moveLocator: Function,
    moveArrayObjectLocator: Function,
    deleteLocator: Function,
    updateLocator: Function,
    updateLocatorValue: Function,
    updateArrayObjecLocatorValue: Function,
    removeObjectOrFolder: Function,
    removeArrayObjectLocator: Function
};

export default class ObjectRepository extends React.PureComponent<Props> {
    constructor(props: Props) {
        super(props);
        this.state = {
            searchResults: []
        };

        this.inputRef = React.createRef();
    }
    
    static Container = styled(FlexColumn)(props => ({
        height: '100vh',
        flexShrink: 0,
        padding: props.floating ? 10 : 0,
    }));

    onSelectNode(path) {
        this.props.setActive(path);
    }

    setSearchResults = searchResults => {
        this.setState({
            searchResults: searchResults
        });
    }

    closeSelectedObject = () => {
        const { closeActive } = this.props;
        if(closeActive){
            closeActive();
        }
    }

    closeObjectRepository= () => {
        const { clearObjectRepositoryFile } = this.props;
        if(clearObjectRepositoryFile){
            clearObjectRepositoryFile();
        }
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

        const editorPanelTitleWrap = (
            <Fragment>
                {editorPanelTitle} 
                <div onClick={this.closeSelectedObject} className={'header-control'}>
                    <Icon type="close" />
                </div>
            </Fragment>
        );

        const repoPanelTitleWrap = (
            <Fragment>
                {repoPanelTitle} 
                <div onClick={this.closeObjectRepository} className={'header-control'}>
                    <Icon type="close" />
                </div>
            </Fragment>
        );

        return (
            <ObjectRepository.Container>
                <Panel 
                    header={ repoPanelTitleWrap }
                    afterHeader = {
                        <Fragment>
                            <SearchRow
                                setSearchResults={ this.setSearchResults }
                                tree={ tree }
                            />
                            <AddToRootRow
                                orAddToRoot={this.props.orAddToRoot}
                            />
                        </Fragment>
                    }
                    scroller
                    scrollWrapperClass="tree-wrapper tree-wrapper-half"
                    scrollRefresh={ this.props.refreshScroll }
                    scrollVerticalOnly
                >
                    <ObjectTree
                        searchResults= { this.state.searchResults }
                        tree={ tree }
                        active={ active }
                        onSelect={ (path) => setActive(path) }
                        showContextMenu = {this.props.showContextMenu}
                    />
                </Panel>
                { selectedObject &&
                <Panel 
                    header={ editorPanelTitleWrap } 
                    noBodyPadding={ true } 
                >
                    <ObjectEditor 
                        refreshScroll={ this.props.refreshScroll }
                        addLocator = {this.props.addLocator}
                        addArrayObjectLocator = {this.props.addArrayObjectLocator}
                        moveLocator = {this.props.moveLocator}
                        moveArrayObjectLocator = {this.props.moveArrayObjectLocator}
                        deleteLocator = {this.props.deleteLocator}
                        updateLocator = {this.props.updateLocator}
                        updateLocatorValue = {this.props.updateLocatorValue}
                        updateArrayObjecLocatorValue = {this.props.updateArrayObjecLocatorValue}
                        removeObjectOrFolder = {this.props.removeObjectOrFolder}
                        removeArrayObjectLocator = {this.props.removeArrayObjectLocator}
                        object={ selectedObject } 
                    />
                </Panel>
                }
            </ObjectRepository.Container>
        );    
    }
}
