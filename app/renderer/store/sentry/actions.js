import * as ActionTypes from './types';

export const reportError = (error) => ({
    type: ActionTypes.UNIVERSAL_ERROR,
    payload: { error: error },
});
  
export const setUserIdToSentry = (userId) => ({
    type: ActionTypes.SET_USER_ID_TO_SENTRY,
    payload: { userId: userId },
});