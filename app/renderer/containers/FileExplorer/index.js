/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import uniq from 'lodash/uniq';
import FileExplorer from './FileExplorer';
import * as actions from '../../store/fs/actions';
import { showContextMenu } from '../../store/workbench/actions';

const mapStoreToProps = (state) => {
    return {
        rootPath: state.fs.rootPath,
        rootName: state.fs.rootPath &&
        state.fs.files.hasOwnProperty(state.fs.rootPath)
            ? state.fs.files[state.fs.rootPath].name
            : null,
        treeData: uniq(state.fs.tree.data),
        activeNodePath: state.fs.tree.activeNode,
        expandedKeys: state.fs.tree.expandedKeys,
        refreshScroll: state.fs.refreshScroll
    };
};

const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ ...actions, showContextMenu }, dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(FileExplorer);
