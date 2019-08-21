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
import { routerMiddleware, routerActions } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { Subject } from 'rxjs';
import rootActionCreator from './actions';
import rootReducer from './reducers';
import createActionToSubjectMiddleware from './middleware/createActionToSubjectMiddleware';
import rootSaga from './sagas';


import ServicesSingleton from '../services';
import { dialog } from 'electron';
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
  const sagaMiddleware = createSagaMiddleware();
  middleware.push(sagaMiddleware);

  // Thunk Middleware
  middleware.push(thunk);

  // Router Middleware
  const router = routerMiddleware(history);
  middleware.push(router);

  // Apply redux-logger if we are in debugging mode
  if (process.env.NODE_ENV === 'development') {
    const { createLogger } = require('redux-logger');
    middleware.push(createLogger({ 
      collapsed: true,
      predicate: (getState, action) => !( (action.type === 'MAIN_SERVICE_EVENT' && action.payload && action.payload.event && action.payload.event.type && action.payload.event.type === "CHROME_EXTENSION_ENABLED"))
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
    'MAIN_SERVICE_EVENT',
    'RESET'
  ] 

  async function updateCache(cache, action) {
    if(action && ignoreTypes.includes(action.type)){
      return;
    }

    if(action && action.type.startsWith('RECORDER_')){
      return;
    }

    if(action && action.type.startsWith('TEST_')){
      return;
    }

    if(action && action.type === 'LOGGER_SET_VISIBLE'){
      // add to save cache
    } else if(action && action.type.startsWith('LOGGER_')){
      return;
    }

    const state = { ...cache };

    delete state.cache;
    delete state.settings.cache;
    delete state.dialog;
    delete state.logger;
    delete state.router;
    delete state.test;
    delete state.recorder;
    delete state.wb;

    const result = await services.mainIpc.call( 'ElectronService', 'updateCache', [state] );

    return state;
  }

  const cache = store => next => action => {
    let result = next(action);
    const state = store.getState();
    // console.log('str', JSON.stringify(state));

    if(state.settings.cacheUsed){
      updateCache(state, action);
      // const cacheStatePromise = updateCache(state, action);
      // cacheStatePromise.then((cacheState) => {
      //   if(typeof cacheState !== 'undefined'){
      //     console.log('cacheState', cacheState);
      //     console.log('cacheState stringify', JSON.stringify(cacheState));
      //   }
      // })
    }

    return result;
  }
  
  middleware.push(cache);

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
}

export default { configureStore, history, action$ };
