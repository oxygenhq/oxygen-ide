/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import * as types from './types';

const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 36;
const SAUCELABS_HUB_DEFAULT_URL = 'https://ondemand.saucelabs.com:443/wd/hub';
const TESTOBJECT_HUB_DEFAULT_URL = 'https://us1-manual.app.testobject.com/wd/hub';
const TESTINGBOT_HUB_DEFAULT_URL = 'https://hub.testingbot.com:443/wd/hub';
const LAMBDATEST_HUB_DEFAULT_URL = 'https://hub.lambdatest.com:443/wd/hub';

const saveCloudProvidersDestruction = (fieldName, object) => {
    let result = {};

    try{
        if(fieldName && object){
            if(
                object && 
        typeof object === 'object' &&
        Object.keys(object).length > 0
            ) {

                if(object['cloudProviders'] && object['cloudProviders'][fieldName]){
                    result = object['cloudProviders'][fieldName];
                }
            }
        }
    } catch(e){
        console.warn('e', e);
        if(window && window.Sentry && window.Sentry.captureException){
            window.Sentry.captureException(e);
        }
    }

    return result;
};

const defaultAppSettings = {
    cache: null,
    files: {},
    visualProviders: {
        applitools: {
            title: 'Applitools',
            accessKey: null,
            checkOnEveryAction: false,
            inUse: false,
        },
    },
    cloudProviders: {
        sauceLabs: {
            title: 'Sauce Labs',
            url: SAUCELABS_HUB_DEFAULT_URL,
            username: null,
            accessKey: null,
            extendedDebugging: false,
            capturePerformance: false,
            inUse: false,
        },
        testObject: {
            title: 'TestObject',
            testObjectUsername: null,
            testobject_api_key: null,
            region: 'usWest1',
            host: TESTOBJECT_HUB_DEFAULT_URL,
            inUse: false,
        },
        testingBot: {
            title: 'TestingBot',
            url: TESTINGBOT_HUB_DEFAULT_URL,
            key: null,
            secret: null,
            extendedDebugging: false,
            inUse: false,
        },
        lambdaTest: {
            title: 'LambdaTest',
            url: LAMBDATEST_HUB_DEFAULT_URL,
            user: null,
            key: null,
            captureNetwork: false,
            captureConsole: false,
            takeScreenshots: false,
            videoRecording: false,
            inUse: false,
        },
    },
    cloudProvidesBrowsersAndDevices: null,
    lastSession: {
        tabs: [],
        rootFolder: null,    
    },
    recentFiles: null,
};

const defaultState = {
    uuid: null,
    first: true,
    showRecorderMessage: null,
    cacheUsed: false,
    showLanding: false,
    fontSize: 12,
    navbar: {
        visible: false,
    },
    logger: {
        visible: true,
    },
    sidebars: {
        left: {
            visible: true,
            size: 250,
        },
        right: {
            visible: false,
            size: 250,
            component: null,
        },
    },
    ...defaultAppSettings,
};

export default (state = defaultState, action) => {
    const payload = action.payload || {};
    const { value, target, settings, zoom, cache, uuid, providers, browsersAndDevices, testProvider, visualProviders } = payload;
    switch (action.type) {
    
    // CREATE USER
    case types.CREATE_USER: {
        return { 
            ...state,
            uuid: uuid
        };
    }

    // SHOW RECORDER MESSAGE VALUE
    case types.SHOW_RECORDER_MESSAGE_VALUE: {
        return { 
            ...state,
            showRecorderMessage: value
        };
    }

    // SHOW LANDING
    case types.SHOW_LANDING: {
        return { 
            ...state,
            showLanding: true
        };
    }

    // CACHE USED CHANGE
    case types.CACHE_USED_CHANGE: {
        return { 
            ...state,
            cacheUsed: value
        };
    }
    
    // HIDE LANDING
    case types.HIDE_LANDING: {
        return { 
            ...state,
            showLanding: false
        };
    }

    // ZOOM_IN
    case types.EDITOR_ZOOM_IN: {
        const newFontSize = state.fontSize+2;
        if(newFontSize > FONT_SIZE_MAX){
            return state;
        } else {
            return { 
                ...state,
                fontSize: newFontSize
            };
        }
    }

    // ZOOM_OUT
    case types.EDITOR_ZOOM_OUT: {
        const newFontSize = state.fontSize-2;
        if(newFontSize < FONT_SIZE_MIN){
            return state;
        } else {
            return { 
                ...state,
                fontSize: newFontSize
            };
        }
    }

    // ZOOM_TO_DEFAULT
    case types.EDITOR_ZOOM_TO_DEFAULT: {
        return { 
            ...state,
            fontSize: defaultState.fontSize
        };
    }

    // SET_ZOOM
    case types.EDITOR_SET_ZOOM: {
        if(zoom){
            return { 
                ...state,
                fontSize: zoom
            };
        } else {
            return state;
        }
    }

    // SETTINGS_MERGE
    case types.SETTINGS_MERGE:
        return {
            ...state,
            ...settings,
            showRecorderMessage: state.showRecorderMessage
        };
    // LAST_SESSION_SET_ROOT_FOLDER
    case types.LAST_SESSION_SET_ROOT_FOLDER:
        return {
            ...state,
            showLanding: false,
            lastSession: {
                ...state.lastSession,
                rootFolder: value,
            },
        };
    // SIDEBAR_SET_VISIBLE
    case types.SIDEBAR_SET_VISIBLE:
        if (typeof value === 'undefined' || typeof target === 'undefined') {
            return state;
        }
        return {
            ...state,
            sidebars: {
                ...state.sidebars,
                [target]: {
                    ...state.sidebars[target],
                    visible: value,
                }
            },
        };
    // SIDEBAR_SET_SIZE
    case types.SIDEBAR_SET_SIZE:
        if (typeof value === 'undefined' || typeof target === 'undefined') {
            return state;
        }
        return {
            ...state,
            sidebars: {
                ...state.sidebars,
                [target]: {
                    ...state.sidebars[target],
                    size: value,
                }
            },
        };
    // SIDEBAR_SET_COMPONENT
    case types.SIDEBAR_SET_COMPONENT:
        if (typeof value === 'undefined' || typeof target === 'undefined') {
            return state;
        }
        return {
            ...state,
            sidebars: {
                ...state.sidebars,
                [target]: {
                    ...state.sidebars[target],
                    component: value,
                }
            },
        };
    // LOGGER_SET_VISIBLE
    case types.LOGGER_SET_VISIBLE:
        if (typeof value === 'undefined') {
            return state;
        }
        return {
            ...state,
            logger: {
                ...state.logger,
                visible: value,
            },
        };
      
    case 'FROM_CACHE': 
        return {
            ...defaultState,
            ...cache.settings,
            cloudProviders: {
                sauceLabs: {
                    ...saveCloudProvidersDestruction('sauceLabs', defaultState),
                    ...saveCloudProvidersDestruction('sauceLabs', cache.settings),
                },
                testObject: {
                    ...saveCloudProvidersDestruction('testObject', defaultState),
                    ...saveCloudProvidersDestruction('testObject', cache.settings),
                },
                testingBot: {
                    ...saveCloudProvidersDestruction('testingBot', defaultState),
                    ...saveCloudProvidersDestruction('testingBot', cache.settings),
                },
                lambdaTest: {
                    ...saveCloudProvidersDestruction('lambdaTest', defaultState),
                    ...saveCloudProvidersDestruction('lambdaTest', cache.settings),
                }
            }
        };
      
    case types.UPDATE_CLOUD_PROVIDERS_SETTINGS: 
        if (!providers || typeof providers !== 'object') {
            return state;
        }
        return {
            ...state,
            cloudProviders: providers
        };

    case types.UPDATE_VISUAL_PROVIDERS_SETTINGS: 
        if (!visualProviders || typeof visualProviders !== 'object') {
            return state;
        }
        return {
            ...state,
            visualProviders: visualProviders
        };

    case types.SET_CLOUD_PROVIDERS_BROWSERS_AND_DEVICES : 
        return {
            ...state,
            cloudProvidesBrowsersAndDevices: {
                ...state.cloudProvidesBrowsersAndDevices, 
                [testProvider]: browsersAndDevices
            }
        };

    case 'RESET': 
        return defaultState;
    
    default:
        return state;
    }
};
