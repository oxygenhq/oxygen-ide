import { all, takeLatest, select, put, call } from 'redux-saga/effects';
import ActionTypes from '../types';

import * as fsActions from '../fs/actions';
import * as tabsActions from './actions';
import { MAIN_SERVICE_EVENT } from '../../services/MainIpc';

import ServicesSingleton from '../../services';
const services = ServicesSingleton();
import confirm from '../../helpers/confirm';

export default function* root() {
    yield all([
        takeLatest(ActionTypes.TABS_REMOVE, removeTab),
        takeLatest(MAIN_SERVICE_EVENT, handleServiceEvents),
    ]);
}

function* handleServiceEvents({ payload }) {
    const {
        event,
        service
    } = payload;

    if (
        service === 'AppCloseService' &&
        event &&
        event.type === 'APP_CLOSE_HAS_UNSAVED_FILES'
    ) {
        const tabsList =  yield select(state => state.tabs.list);
        const hasUnsavedFiles = tabsList.find(tab => tab.touched);

        if (hasUnsavedFiles) {
            const answer = yield call(confirm, {
                title: 'There are unsaved files',
                content: 'Do you really want to close the application?',
                okText: 'Yes',
                cancelText: 'No',
            });
            
            if (answer) {
                // Yes
                yield services.mainIpc.call('AppCloseService', 'closeApp');
            } else {
                // No
                yield services.mainIpc.call('AppCloseService', 'stayAppOpened');
            }
        } else {
            // No unsaved Files
            yield services.mainIpc.call('AppCloseService', 'closeApp');
        }
    }
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
