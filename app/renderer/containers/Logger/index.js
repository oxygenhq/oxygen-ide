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
import Logger from './Logger.jsx';
import * as logActions from '../../store/logger/actions';
import * as testActions from '../../store/test/actions';

const mapStoreToProps = (state) => {
    return {
        logs: state.logger.logs || [],
        active: state.logger.active,
        variables: state.test.variables,
        repl: state.test.repl
    };
};
  
const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ ...logActions, ...testActions } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(Logger);
