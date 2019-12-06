/*
 * Copyright (C) 2015-2019 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { connect } from 'react-redux';
import ObjectRepositoryNotValidView from './ObjectRepositoryNotValidView.jsx';
import { bindActionCreators } from 'redux';
import * as orActions from '../../store/obj-repo/actions';
import { findObject } from '../../helpers/objrepo';
import { 
    showContextMenu, 
    addLocator, 
    addArrayObjectLocator,
    moveLocator,
    moveArrayObjectLocator,
    deleteLocator, 
    updateLocator, 
    removeObjectOrFolder, 
    removeArrayObjectLocator,
    updateLocatorValue,
    updateArrayObjecLocatorValue,
    orAddToRoot
} from '../../store/workbench/actions';

const mapStoreToProps = (state) => {
    return {
        tree: state.objrepo.tree,
        active: state.objrepo.active,
        selectedObject: findObject(state.objrepo.tree, state.objrepo.active),
        name: state.objrepo.name,
    };
};

const mapDispatchToProps = (dispatch) => (
    bindActionCreators({ 
        ...orActions, 
        showContextMenu, 
        addLocator, 
        addArrayObjectLocator,
        moveLocator,
        moveArrayObjectLocator,
        deleteLocator, 
        updateLocator, 
        removeObjectOrFolder, 
        removeArrayObjectLocator,
        updateLocatorValue,
        updateArrayObjecLocatorValue,
        orAddToRoot
    } , dispatch)
);

export default connect(mapStoreToProps, mapDispatchToProps)(ObjectRepositoryNotValidView);
  