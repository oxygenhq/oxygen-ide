/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import Tabs from './Tabs.jsx';
import * as actions from '../../store/tabs/actions';

const mapStoreToProps = (state) => {
    return {
        recorder: state.recorder,
        tabs: state.tabs.list,
        active: state.tabs.active,
        activeTitle: state.tabs.activeTitle,
    };
};
  
const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ ...actions } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(Tabs);
