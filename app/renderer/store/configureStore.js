/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import { createHashHistory } from 'history';
import createSagaMiddleware from 'redux-saga';
import { Subject } from 'rxjs';
import rootReducer from './reducers';
import createActionToSubjectMiddleware from './middleware/createActionToSubjectMiddleware';
import rootSaga from './sagas';
import { UNIVERSAL_ERROR, SET_USER_ID_TO_SENTRY } from '../store/sentry/types';
import  * as fsActionTypes from './fs/types';
import  * as settingsActionTypes from './settings/types';
import { MAIN_MENU_EVENT, MAIN_SERVICE_EVENT, MAIN_SERVICE_LOG  } from '../services/MainIpc';


import ServicesSingleton from '../services';
const services = ServicesSingleton();
const history = createHashHistory();

// initialize Rxjs subject for action to subject middleware
let action$ = new Subject();

const configureStore = (initialState?: counterStateType) => {
    // prevent duplicated store initialization
    if (global.store) {
        return global.store;
    }

    // Redux Configuration
    const middleware = [];
    const enhancers = [];

    // Saga Middleware
    const sagaMiddleware = createSagaMiddleware({
        onError(error) {
            console.log('saga error', error);

            const err = new Error(error.message || error);

            sendError(err);
        }
    });
    middleware.push(sagaMiddleware);

    // Thunk Middleware
    middleware.push(thunk);

    // Apply redux-logger if we are in debugging mode
    if (process.env.NODE_ENV === 'development') {
        const { createLogger } = require('redux-logger');
        middleware.push(createLogger({ 
            collapsed: true,      
            predicate: (getState, action) => !((
                action.payload && 
        action.payload.event && 
        action.payload.event.type && 
        ['CHROME_EXTENSION_ENABLED', 'RECORDER_NEW_CAN_RECORD'].includes(action.payload.event.type)
            ))
        }));
    }

    // Apply Rxjs Action to Subject middleware
    middleware.push(createActionToSubjectMiddleware(action$));

    // Redux DevTools Configuration
    // If Redux DevTools Extension is installed use it, otherwise use Redux compose
    /* eslint-disable no-underscore-dangle */
    /*
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      // Options: http://zalmoxisus.github.io/redux-devtools-extension/API/Arguments.html
      rootActionCreator,
    })
    : compose;
  */
    const composeEnhancers = compose;
    /* eslint-enable no-underscore-dangle */

    const ignoreTypes = [
        MAIN_MENU_EVENT,
        MAIN_SERVICE_EVENT,
        MAIN_SERVICE_LOG,
        'RESET',
        'DIALOG',
        fsActionTypes.FS_SAVE_FILE,
        fsActionTypes.FS_SAVE_FILE_AS,
        fsActionTypes.FS_TREE_UN_WATCH_FOLDER,
        fsActionTypes.FS_TREE_WATCH_FOLDER,
        fsActionTypes.FS_MOVE,
        settingsActionTypes.SET_CLOUD_PROVIDERS_BROWSERS_AND_DEVICES,
        settingsActionTypes.FIRST_OPEN,
        settingsActionTypes.TMP_UPDATE_FILE_CONTENT,
        settingsActionTypes.TMP_REMOVE_FILE,
        settingsActionTypes.TMP_ADD_FILE
    ]; 

    async function updateCache(lastState, action) {
        if(action && ignoreTypes.includes(action.type)){
            return;
        }

        if(action && action.type.startsWith('RECORDER_')){
            return;
        }

        if(action && action.type.startsWith('TEST_')){
            return;
        }
        
        if(action && action.type.startsWith('DIALOG_')){
            return;
        }        

        if(action && action.type.startsWith('WB_')){
            return;
        }
        
        if(action && action.type.startsWith('FROM_CACHE_')){
            return;
        }

        if(action && action.type === 'LOGGER_SET_VISIBLE'){
            // add to save cache
        } else if(action && action.type.startsWith('LOGGER_')){
            return;
        }

        const state = {
            tree: lastState.tree,
            editor: lastState.editor,
            fs: lastState.fs,
            objrepo: lastState.objrepo,
            tabs: lastState.tabs,
            settings: getSettings(lastState)
        };

        await services.mainIpc.call( 'ElectronService', 'updateCache', [state] );
        return state;
    }

    const cache = store => next => action => {
        let result = next(action);
        const state = store.getState();

        if(state.settings.cacheUsed){
            updateCache(state, action);
        }

        return result;
    };

    async function sendError(error) {
        // not implemented
    }

    async function setUserIdToSentry(userId) {
        try{

            if(userId && window && window.Sentry && window.Sentry.configureScope){
                window.Sentry.configureScope((scope) => {
                    scope.setUser({'userId': userId});
                });
            } else {
                console.log('maybe bad userId', userId);
                console.log('or window.Sentry', window.Sentry);
            }

        } catch(e){
            console.warn('setUserIdToSentry error', e);
        }
    }

    middleware.push(cache);

    // UNIVERSAL_ERROR
    const universalError = store => next => action => {
        let result = next(action);

        if(action && action.type && action.payload && action.payload.error && action.type === UNIVERSAL_ERROR){
            sendError(action.payload.error);
        }
    
        if(action && action.type && action.payload && action.payload.userId && action.type === SET_USER_ID_TO_SENTRY){
            setUserIdToSentry(action.payload.userId);
        }
    
        return result;
    };
  
    middleware.push(universalError);
  
    // Apply Middleware & Compose Enhancers
    enhancers.push(applyMiddleware(...middleware));
    const enhancer = composeEnhancers(...enhancers);

    // Create Store
    const store = createStore(rootReducer, initialState, enhancer);

    // add hot reducer reloading if we are in debugging mode
    if (process.env.NODE_ENV === 'development' && module.hot) {
        module.hot.accept('./reducers.js', () => {
            store.replaceReducer(require('./reducers'));
        });
    }

    // Run Saga Middleware (must be ran after applyMiddleware is being called)
    sagaMiddleware.run(rootSaga);

    global.store = store;
    return store;
};


const getSettings = (lastState) => {
    if(lastState && lastState.settings){
        
        /* eslint-disable */
        const { cache, cloudProvidesBrowsersAndDevices, ...rest } = lastState.settings;
        /* eslint-anable */

        return rest;
    } else {
        return null;
    }
}


export default { configureStore, history, action$ };
