/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import 'babel-polyfill';


/**
* This does the async request and provides Redux thunk feedback 
*/
export default function dispatchAsync(promise, dispatch, type, payload) {
  if (typeof dispatch !== 'function'){
    throw new Error('dispatch was not a function. Did you miss an update to the call?')
  }
  const TYPE_REQ = type + "_REQ";
  const TYPE_RSP = type + "_RSP";
  const TYPE_ERR = type + "_ERR";

  dispatch({ 
    type: TYPE_REQ,
    payload: Object.assign({}, payload),
  });
  promise.then(
    (response)  => dispatch({
        type: TYPE_RSP,
        success: true,
        payload: Object.assign({}, payload, { response }),
    }),
    (error)  => dispatch({
        type: TYPE_ERR,
        success: false,
        payload: Object.assign({}, payload, { error }),
    })
  );
};
