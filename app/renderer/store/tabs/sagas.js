import { all, takeLatest, select, put } from 'redux-saga/effects';
import ActionTypes from '../types';

import * as fsActions from '../fs/actions';
import * as tabsActions from './actions';

export default function* root() {
    yield all([
        takeLatest(ActionTypes.TABS_REMOVE, removeTab)
    ]);
}

function* removeTab({ payload }) {
    const { key, title } = payload || {};
    const state =  yield select(state => state.tabs);
    let newListAfterRemove;
    if (title && !!title && key === 'unknown') {
        newListAfterRemove = state.list.filter(tab => key === 'unknown' && tab.title !== title);
    } else {
        newListAfterRemove = state.list.filter(tab => tab.key !== key);
    }
    let newActiveTabKey = state.active;
    let newTabKey = false;
    if (newActiveTabKey === key) {
        newActiveTabKey = newListAfterRemove.length > 0 ? newListAfterRemove[newListAfterRemove.length - 1].key : null;
        newTabKey = true;
    }

    let activeTitle;
    if (newActiveTabKey === 'unknown') {
        activeTitle = newListAfterRemove[newListAfterRemove.length - 1].title;
        
        if (newTabKey) {
            // unselect previous selected file in files tree 
            yield put(fsActions.setActiveNode(null));
        }
    } else {
        activeTitle = null;

        if (newTabKey) {
            // select new selected file in files tree 
            yield put(fsActions.setActiveNode(newActiveTabKey));
        }
    }

    yield put(tabsActions.removeTabSuccess({
        newListAfterRemove: newListAfterRemove,
        newActiveTabKey: newActiveTabKey,
        activeTitle: activeTitle,
    }));
}
