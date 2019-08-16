import * as ActionTypes from './types';

export const reportError = (error) => ({
    type: ActionTypes.UNIVERSAL_ERROR,
    payload: { error: error },
});
  