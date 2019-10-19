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
import Settings from './Settings';
import * as actions from '../../store/test/actions';

const mapStoreToProps = (state) => {
    return {
        runtimeSettings: state.test.runtimeSettings,
    };
};
  
const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ ...actions } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(Settings);
