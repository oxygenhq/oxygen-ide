/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as ActionTypes from './types';
import { success, failure } from '../../helpers/redux';

export const initialize = () => {
  return {
    type: ActionTypes.WB_INIT,
    payload: null,
  };
};

export const deactivate = () => {
  return {
    type: ActionTypes.WB_DEACTIVATE,
    payload: null,
  };
};


export const reset = () => {
  return {
    type: 'RESET',
    payload: null,
  };
};


export const restoreFromCache = (cache) => {
  return {
    type: 'FROM_CACHE',
    payload: { cache },
  };
};

export const _restoreFromCache_Success = () => {
  return {
    type: success('FROM_CACHE'),
    payload: {},
  };
}

export const setJavaError = (error) => {
  return {
    type: ActionTypes.WB_SET_JAVA_ERROR,
    payload: { 
      error: error
    }
  }
}

export const cleanJavaError = () => {
  return {
    type: ActionTypes.WB_CLEAN_JAVA_ERROR
  }
}

/* createNewRealFile */

export const createNewRealFile = (fakeFile=null) => {
  return {
    type: ActionTypes.WB_CREATE_NEW_REAL_FILE,
    payload: {
      fakeFile: fakeFile
    },
  }
};

/* openFakeFile */

export const openFakeFile = () => {
  return {
    type: ActionTypes.WB_OPEN_FAKE_FILE,
    payload: null,
  }
};

export const _openFakeFile_Success = (key,name) => {
  return {
    type: success(ActionTypes.WB_OPEN_FAKE_FILE),
    payload: { key, name },
  }
}

export const _openFakeFile_Failure = (error) => {
  return {
    type: failure(ActionTypes.WB_OPEN_FAKE_FILE),
    payload: { error },
  }
}


/* openFile */
export const openFile = (path) => {
  return {
    type: ActionTypes.WB_OPEN_FILE,
    payload: { path },
  }
};
export const _openFile_Success = (path) => {
  return {
    type: success(ActionTypes.WB_OPEN_FILE),
    payload: { path },
  }
};
export const _openFile_Failure = (path, error) => {
  return {
    type: failure(ActionTypes.WB_OPEN_FILE),
    payload: { path, error },
  }
};

/* closeFile */
export const closeFile = (path, force = false, name = null) => {
  return {
    type: ActionTypes.WB_CLOSE_FILE,
    payload: { path, force, name },
  };
};

export const _closeFile_Success = (path, name = null) => {
  return {
    type: success(ActionTypes.WB_CLOSE_FILE),
    payload: { path, name },
  };
};

/* closeAllFiles */
export const closeAllFiles = (force = false) => {
  return {
    type: ActionTypes.WB_CLOSE_ALL_FILES,
    payload: { force: force },
  };
};


/* deleteFile */
export const deleteFile = (path) => {
  return {
    type: ActionTypes.WB_DELETE_FILE,
    payload: { path },
  };
};

export const _deleteFile_Success = (path) => {
  return {
    type: success(ActionTypes.WB_DELETE_FILE),
    payload: { path },
  };
};

export const _deleteFile_Failure = (path) => {
  return {
    type: failure(ActionTypes.WB_DELETE_FILE),
    payload: { path },
  };
};

/* openFolder */
export const openFolder = (path) => {
  return {
    type: ActionTypes.WB_OPEN_FOLDER,
    payload: { path },
  };
};
/* createFile */
export const createFile = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_FILE,
    payload: { path, name },
  };
};

export const createObjectElement = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_OBJECT_ELEMENT,
    payload: { path, name },
  };
};

export const renameObjectElementOrContainer = (newName, type, path) => {
  return {
    type: ActionTypes.WB_RENAME_OBJECT_ELEMENT_OR_CONTAINER,
    payload: { path, type, newName },
  };
};

export const removeObjectElementOrContainer = (type, path) => {
  return {
    type: ActionTypes.WB_REMOVE_OBJECT_ELEMENT_OR_CONTAINER,
    payload: { path, type },
  };
};


export const createObjectContainer = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_OBJECT_CONTAINER,
    payload: { path, name },
  };
};

export const addLocator = (path, name) => {
  return {
    type: ActionTypes.WB_ADD_LOCATOR,
    payload: { path, name },
  };
};

export const addArrayObjectLocator = (path, name) => {
  return {
    type: ActionTypes.WB_ADD_ARRAY_OBJECT_LOCATOR,
    payload: { path, name },
  };
};

export const moveLocator = (path, name, direction, index) => {
  return {
    type: ActionTypes.WB_MOVE_LOCATOR,
    payload: { path, name, direction, index },
  };
};

export const moveArrayObjectLocator = (path, index, direction) => {
  return {
    type: ActionTypes.WB_MOVE_ARRAY_OBJECT_LOCATOR,
    payload: { path, index:index, direction },
  };
};

export const deleteLocator = (obj) => {
  return {
    type: ActionTypes.WB_DELETE_LOCATOR,
    payload: { obj },
  };
};

export const updateLocatorValue = (path, newValue) => {
  return {
    type: ActionTypes.WB_UPDATE_LOCATOR_VALUE,
    payload: { path, newValue },
  };
};

export const updateArrayObjecLocatorValue = (path, newValue, idx) => {
  return {
    type: ActionTypes.WB_UPDATE_ARRAY_OBJECT_LOCATOR_VALUE,
    payload: { path, newValue, idx:idx },
  };
};

export const updateLocator = (path, newName, oldName) => {
  return {
    type: ActionTypes.WB_UPDATE_LOCATOR,
    payload: { path, newName, oldName },
  };
};

export const removeObjectOrFolder = (path, name) => {
  return {
    type: ActionTypes.WB_REMOVE_OBJECT_OR_FOLDER,
    payload: { path, name },
  };
};

export const removeArrayObjectLocator = (path, idx) => {
  return {
    type: ActionTypes.WB_REMOVE_ARRAY_OBJECT_LOCATOR,
    payload: { path, idx:idx },
  };
};

export const _createFile_Success = (path, name) => {
  return {
    type: success(ActionTypes.WB_CREATE_FILE),
    payload: { path, name },
  };
};
export const _createFile_Failure = (path, name, error) => {
  return {
    type: failure(ActionTypes.WB_CREATE_FILE),
    payload: { path, name, error },
  };
};
/* createFolder */
export const createFolder = (path, name) => {
  return {
    type: ActionTypes.WB_CREATE_FOLDER,
    payload: { path, name },
  };
};
export const _createFolder_Success = (path, name) => {
  return {
    type: success(ActionTypes.WB_CREATE_FOLDER),
    payload: { path, name },
  };
};
export const _createFolder_Failure = (path, name, error) => {
  return {
    type: failure(ActionTypes.WB_CREATE_FOLDER),
    payload: { path, name, error },
  };
};
/* renameFile */
export const renameFile = (path, newName) => {
  return {
    type: ActionTypes.WB_RENAME_FILE,
    payload: { path, newName },
  };
};
/* saveCurrentFile */
export const saveCurrentFile = (prompt = false) => ({
  type: ActionTypes.WB_SAVE_CURRENT_FILE,
  payload: { prompt },
});
/* showDialog */
export const showDialog = (dialog, params) => ({
  type: ActionTypes.WB_SHOW_DIALOG,
  payload: { dialog, params: params || [] },
});
/* hideDialog */
export const hideDialog = (dialog) => ({
  type: ActionTypes.WB_HIDE_DIALOG,
    payload: { dialog },
});
/* showNewFileDialog */
export const showNewFileDialog = () => ({
  type: ActionTypes.WB_SHOW_NEW_FILE_DIALOG,
    payload: null,
});
/* startRecorder */
export const startRecorder = () => ({
  type: ActionTypes.WB_START_RECORDER,
    payload: { },
});
/* stopRecorder */
export const stopRecorder = () => ({
  type: ActionTypes.WB_STOP_RECORDER,
    payload: { },
});

/* startRecorderWatcher */
export const startRecorderWatcher = () => ({
  type: ActionTypes.WB_RECORDER_START_WATCHER
});

/* onTabChange */
export const onTabChange = (key, name = null) => {
  return {
    type: ActionTypes.WB_ON_TAB_CHANGE,
    payload: { key, name },
  };
};
/* onContentUpdate */
export const onContentUpdate = (path, content, name = null) => {
  return {
    type: ActionTypes.WB_ON_CONTENT_UPDATE,
    payload: { path, content, name },
  }
}
/* showContextMenu */
export const showContextMenu = (type, event = null, node = null) => ({
  type: ActionTypes.WB_SHOW_CONTEXT_MENU,
  payload: { type, event, node },
})

export const orAddToRoot = (name, key) => ({
  type: ActionTypes.WB_OR_ADD_TO_ROOT,
  payload: { name, key },
})