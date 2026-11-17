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
import SearchPanel from './SearchPanel.jsx';
import * as searchActions from '../../store/search/actions';

const mapStoreToProps = (state) => {
    const { fs, search, settings } = state;
    return {
        search,
        rootPath: fs.rootPath,
        rootName: fs.rootPath && fs.files.hasOwnProperty(fs.rootPath) ? fs.files[fs.rootPath].name : null,
        loggerVisible: !!(settings && settings.logger && settings.logger.visible)
    };
};

const mapDispatchToProps = (dispatch) => (
    bindActionCreators(searchActions, dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(SearchPanel);
