/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { Fragment } from 'react';
import {Layout, Icon, Row, Col, message, notification } from 'antd';
import updateModals from '../../components/updateModals';
// Dialogs
import JavaDialog from '../../components/dialogs/JavaDialog.jsx';
import XCodeDialog from '../../components/dialogs/XCodeDialog.jsx';
import AndroidHomeErrorDialog from '../../components/dialogs/AndroidHomeErrorDialog.jsx';
import FileRenameDialog from '../../components/dialogs/FileRenameDialog.jsx';
import FileCreateDialog from '../../components/dialogs/FileCreateDialog.jsx';
import ObjectElementCreateDialog from '../../components/dialogs/ObjectElementCreateDialog.jsx';
import ObjectElementOrContainerRenameDialog from '../../components/dialogs/ObjectElementOrContainerRenameDialog.jsx';
import ObjectElementOrContainerRemoveDialog from '../../components/dialogs/ObjectElementOrContainerRemoveDialog.jsx';
import ObjectContainerCreateDialog from '../../components/dialogs/ObjectContainerCreateDialog.jsx';
import UpdateDialog from '../../components/dialogs/UpdateDialog.jsx';
import SettingsDialog from '../../components/dialogs/SettingsDialog.jsx';
import NeedInstallExtension from '../../components/dialogs/NeedInstallExtension';

import ChromeDriverDialog from '../../components/dialogs/ChromeDriverDialog';
import ChromeDriverDownloadingDialog from '../../components/dialogs/ChromeDriverDownloadingDialog';
import ChromeDriverDownloadingSuccessDialog from '../../components/dialogs/ChromeDriverDownloadingSuccessDialog';
import ChromeDriverDownloadingFailedDialog from '../../components/dialogs/ChromeDriverDownloadingFailedDialog';

import EdgeDriverDialog from '../../components/dialogs/EdgeDriverDialog';
import EdgeDriverDownloadingDialog from '../../components/dialogs/EdgeDriverDownloadingDialog';
import EdgeDriverDownloadingSuccessDialog from '../../components/dialogs/EdgeDriverDownloadingSuccessDialog';
import EdgeDriverDownloadingFailedDialog from '../../components/dialogs/EdgeDriverDownloadingFailedDialog';

import EncryptDecryptDialog from '../../components/dialogs/EncryptDecryptDialog.jsx';

// Other components
import TextEditor from '../TextEditor';
import Tabs from '../Tabs';
import FileExplorer from '../FileExplorer';
import Logger from '../Logger';
import Toolbar from '../../components/Toolbar/index.jsx';
import Navbar from '../../components/Navbar.jsx';
import Sidebar from '../../components/Sidebar.jsx';
import Initializing from '../../components/Initializing';
import Settings from '../Settings';
import ObjectRepository from '../ObjectRepository';
import ObjectRepositoryNotValid from '../ObjectRepository/ObjectRepositoryNotValid';
import * as Controls from '../../components/Toolbar/controls';
// Styles
import '../../css/common.scss';
import '../../css/workbench.scss';

const { Header } = Layout;

type Props = {
    settings: object,
    initialize: Function,
    startRecorderWatcher: Function,
    deactivate: Function,
    isRecording: boolean,
    stopRecorder: Function,
    zoomIn: Function,
    zoomOut: Function,
    onTabChange: Function,
    closeFile: Function,
    onContentUpdate: Function,
    updateBreakpoints: Function,
    setSidebarSize: Function,
    setSidebarVisible: Function,
    editorActiveFile: object,
    createNewRealFile: Function,
    startTest: Function,
    startAllTests: Function,
    stopTest: Function,
    continueTest: Function,
    setTestMode: Function,
    showDialog: Function,
    saveCurrentFile: Function,
    showNewFileDialog: Function,
    openFakeFile: Function,
    startRecorder: Function,
    setTestTarget: Function,
    setStepDelay: Function,
    setTestProvider: Function,
    test: object,
    openFile: Function,
    deleteFile: Function,
    move: Function,
    hideDialog: Function,
    setLoggerVisible: Function,
    createFolder: Function,
    createFile: Function,
    createObjectElement: Function,
    renameObjectElementOrContainer: Function,
    removeObjectElementOrContainer: Function,
    createObjectContainer: Function,
    renameFile: Function,
    updateRunSettings: Function,
    updateCloudProvidersSettings: Function,
    updateIntegrationsSettings: Function,
    updateRunSettings: Function,
    startDownloadChromeDriver: Function,
    showDownloadChromeDriverError: Function,
    dialog: Object,
    javaError: Object | undefined,
    xCodeError: Object | undefined,
    isAndroidHomeError: boolean | undefined,
    initialized: boolean,
    changeShowRecorderMessageValue: Function,
    canRecord: boolean,
    cleanJavaError: Function,
    cleanXCodeError: Function,
    cleanAndroidHomeError: Function,
    objrepoPath: string | null,
    editorActiveFilePossibleRepoPath: string | null,
    objrepoName: string | null,
    isChromeExtensionEnabled: boolean,
    waitChromeExtension: boolean,
    stopWaitChromeExtension: Function,
    updateGeneralSettings: Function,
    showDownloadEdgeDriverError: Function,
    startDownloadEdgeDriver: Function,
    replStart: Function,
    encryptDecryptDialogOnAction: Function,
    changeShowShowAndroidHomeError: Function
};

// set global message position
message.config({
    top: 65
});

export default class Workbench extends React.Component<Props> {
    constructor(props: Props) {
        super(props);

        this.on = false;

        this.handleTabChange = this.handleTabChange.bind(this);
        this.handleTabClose = this.handleTabClose.bind(this);
        this.state = {
            showUpdatesDialog: false,
            showNoUpdatesDialog: false,
            toolbarControls: {
                'CTRL_TEST_CONTINUE': {
                    visible: false,
                },
                'CTRL_TEST_STOP': {
                    visible: false,
                }
            },
        };
    }

    componentDidMount() {
        // start IDE initialization process
        this.props.initialize();
        this.props.startRecorderWatcher();
    }

    componentDidUpdate() {
        if (!this.elem) {
            this.elem = document.getElementById('editors-container-wrap');
  
            if (this.elem && this.elem.addEventListener) {
                this.elem.addEventListener('keydown', this.keydownCallback);
                this.elem.addEventListener('keyup', this.keyupCallback);
            }
        }
    }

    componentWillUnmount() {
        // stop IDE process
        if (this.props.deactivate) {
            this.props.deactivate();
        } else {
            alert('no deactivate');
        }
        const { isRecording } = this.props;
        if (isRecording) {
            if (this.props.stopRecorder) {
                this.props.stopRecorder();
            } else {
                alert('no stopRecorder');
            }  
        }
        
        if (this.elem && this.elem.removeEventListener) {
            this.elem.removeEventListener('keydown', this.keydownCallback);
            this.elem.removeEventListener('keyup', this.keyupCallback);
        }
    }

    keydownCallback = (e) => {
        //   if(e.key === 'Control'){
        //       if(!this.on){
        //           e.stopPropagation();
        //           this.elem.addEventListener('wheel', this.wheelCallback , true);
        //           this.on = true;
        //       }
        //   }

        if (e.ctrlKey || e.metaKey) {
            if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd' || e.code  === 'Equal') {
                e.stopPropagation();
                if (this.props.zoomIn) {
                    this.props.zoomIn();
                }
            }
        
            if (e.key === '-' || e.code === 'Minus' || e.code === 'NumpadSubtract') {
                e.stopPropagation();
                if (this.props.zoomOut) {
                    this.props.zoomOut();
                }
            }
        }
    }
    
    keyupCallback = (e) => {
        //   if(e.key === 'Control'){
        //       e.stopPropagation();
        //       this.elem.removeEventListener('wheel',  this.wheelCallback , true);
        //       this.on = false;
        //   }
    }

    //   wheelCallback = (e) => {
    //       e.stopPropagation();
        
    //       if(e && e.deltaY && e.deltaY < 0){
    //       //up
    //           if(this.props.zoomIn){
    //               this.props.zoomIn();
    //           }
    //       }
    //       if(e && e.deltaY && e.deltaY > 0){
    //       //down
    //           if(this.props.zoomOut){
    //               this.props.zoomOut();
    //           }
    //       }
    //   }

    handleTabChange(key, name = null) {
        this.props.onTabChange(key, name);
    }

    handleTabClose(key, name = null) {
        this.props.closeFile(key, false, name);
    }

    handleFileContentUpdate(path, content, name) {
        this.props.onContentUpdate(path, content, name);
    }

    handleBreakpointsUpdate(filePath, breakpoints, name) {
        this.props.updateBreakpoints(filePath, breakpoints, name);
    }

    handleSidebarResize(sidebar, newSize) {
        this.props.setSidebarSize(sidebar, newSize);
    }

    toggleSidebarVisible(sidebar) {
        this.props.setSidebarVisible(sidebar, !this.props.settings.sidebars[sidebar].visible);
    }

    handleToolbarButtonClick(ctrlId) {
        if (ctrlId === Controls.TEST_RUN) {     
            const { editorActiveFile } = this.props;

            if (editorActiveFile) {

                if (editorActiveFile && editorActiveFile.path && editorActiveFile.path ==='unknown') {
                    this.props.createNewRealFile(editorActiveFile);
                } else {
                    this.props.startTest();
                }

            } else {
                this.props.createNewRealFile();
                notification['error']({
                    message: 'Can\'t record when not opened file',
                    description: 'Please, select some file in the tree to make record possible.'
                });
            }
        
        }
        else if (ctrlId === Controls.TEST_RUN_ALL) {
            this.props.startAllTests();
        }
        else if (ctrlId === Controls.TEST_STOP) {
            this.props.stopTest();
        }
        else if (ctrlId === Controls.TEST_REPL_START) {
            this.props.replStart();
        }
        else if (ctrlId === Controls.TEST_FORCE_STOP) {
            this.props.stopTest(true);
        }
        else if (ctrlId === Controls.TEST_CONTINUE) {
            this.props.continueTest();
        }
        else if (ctrlId === Controls.TEST_MODE_MOB) {
            this.props.setTestMode('mob');
        }
        else if (ctrlId === Controls.TEST_MODE_WEB) {
            this.props.setTestMode('web');
        }
        else if (ctrlId === Controls.TEST_MODE_RESP) {
            this.props.setTestMode('resp');
        }
        else if (ctrlId === Controls.OPEN_FOLDER) {
            this.props.showDialog('OPEN_FOLDER');
        }
        else if (ctrlId === Controls.SAVE_FILE) {
            this.props.saveCurrentFile();
        }
        else if (ctrlId === Controls.NEW_FOLDER) {
            this.props.showNewFileDialog();
        }
        else if (ctrlId === Controls.NEW_FILE) {
            if (this.props.openFakeFile) {
                this.props.openFakeFile();
            } else {
                console.warn('no openFakeFile');
            }
        }
        else if (ctrlId === Controls.TEST_RECORD) {
            const { isRecording } = this.props;
            if (isRecording) {
                this.props.stopRecorder();  
            }
            else {
                this.props.startRecorder();
            }
        }
        else if (ctrlId === Controls.TEST_SETTINGS) {
        //this.toggleSidebarVisible('right');
            this.props.showDialog('DIALOG_SETTINGS');
        }
    }

    handleToolbarValueChange(ctrlId, value) {
        if (ctrlId === Controls.TEST_TARGET) {
            if (value !== '-') {
                this.props.setTestTarget(value);
            }      
        }
        else if (ctrlId === Controls.TEST_STEP_DELAY) {
        // convert string value to number
            if (value && !Number.isNaN(value)) {
                const intVal = parseInt(value);
                intVal >= 0 && this.props.setStepDelay(intVal);
            }      
        }
        else if (ctrlId === Controls.TEST_PROVIDER) {
            this.props.setTestProvider(value);
        }
    }

    getToolbarControlsState() {
        const { test, isRecording, editorActiveFile } = this.props;
        const {
            isRunning,
            isPaused,
            isStopingTest,
            isStopingTestForce,
            repl 
        } = test;
        const { canStart } = repl;

        return {
            [Controls.TEST_RUN]: {
                visible: !isRunning,
                enabled: !isRecording && 
                    !!editorActiveFile && 
                    editorActiveFile.ext && 
                    ['.js', '.feature'].includes(editorActiveFile.ext)
            },
            [Controls.TEST_STOP]: {
                visible: isRunning && !isStopingTest,
            },
            [Controls.TEST_FORCE_STOP]: {
                visible: isRunning && !isStopingTestForce,
            },
            [Controls.TEST_STOPING]: {
                visible: !!isStopingTest,
                enabled: false
            },
            [Controls.TEST_CONTINUE]: {
                visible: isPaused,
            },
            [Controls.TEST_RECORD]: {
                selected: isRecording,
            },
            [Controls.TEST_SETTINGS]: {
                selected: false,
            },
            [Controls.TEST_REPL_START]: {
                visible: isRunning && !isPaused && canStart,
            },
        };
    }
    
    /* File Explorer Events */
    fileExplorer_onSelect(file) {
        if (file.type === 'file') {
            this.props.openFile(file.path);
        }
    }
    fileExplorer_onCreate(type, parentPath) {
        this.props.showDialog('DIALOG_FILE_CREATE', { type, path: parentPath });
    }
    fileExplorer_onRename(type, path, name) {
        this.props.showDialog('DIALOG_FILE_RENAME', { type, path, name });
    }

    fileExplorer_onMove(oldPath, newPath) {
        this.props.move(oldPath, newPath);
    }

    /* Logger */
    logger_onHide() {
        this.props.setLoggerVisible(false);
    }
    /* Dialogs Events */
    fileCreateDialog_onSubmit(name, type, parentPath) {
        this.props.hideDialog('DIALOG_FILE_CREATE');
        if (type === 'folder') {
            this.props.createFolder(parentPath, name);
        }
        else {
            this.props.createFile(parentPath, name);
        }
    }

    needInstallExtensionOnClose = () => {
        this.props.hideDialog('DIALOG_NEED_ISTALL_EXTENSION');
    }

    fileCreateDialog_onCancel() {
        this.props.hideDialog('DIALOG_FILE_CREATE');
    }

    objectElementCreateDialog_onSubmit(name, type, parentPath) {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_CREATE');
        this.props.createObjectElement(name, parentPath);
    }

    objectElementCreateDialog_onCancel() {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_CREATE');
    }
    
    objectElementRenameDialog_onSubmit(name, type, parentPath) {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME');
        this.props.renameObjectElementOrContainer(name, type, parentPath);
    }

    objectElementRenameDialog_onCancel() {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME');
    }
    
    objectElementRemoveDialog_onSubmit(name, type, parentPath) {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE');
        this.props.removeObjectElementOrContainer(name, type, parentPath);
    }

    objectElementRemoveDialog_onCancel() {
        this.props.hideDialog('DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE');
    }
        
    objectContainerCreateDialog_onSubmit(name, type, parentPath) {
        this.props.hideDialog('DIALOG_OBJECT_CONTAINER_CREATE');
        this.props.createObjectContainer(name, parentPath);
    }

    objectContainerCreateDialog_onCancel() {
        this.props.hideDialog('DIALOG_OBJECT_CONTAINER_CREATE');
    }

    // Rename
    fileRenameDialog_onSubmit(path, type, newName) {
        this.props.hideDialog('DIALOG_FILE_RENAME');
        this.props.renameFile(path, newName);
    }
    fileRenameDialog_onCancel() {
        this.props.hideDialog('DIALOG_FILE_RENAME');
    }
    // Update
    updateDialog_onSubmit() {
        this.props.hideDialog('DIALOG_UPDATE');
    }
    updateDialog_onCancel() {
        this.props.hideDialog('DIALOG_UPDATE');
    }
    // Settings
    settingsDialog_onSubmit(generalSettings, providers, integrations, runSettings) {
        this.props.hideDialog('DIALOG_SETTINGS');

        if (generalSettings) {
            this.props.updateGeneralSettings(generalSettings);
        }

        if (providers) {
            this.props.updateCloudProvidersSettings(providers);
        }

        if (integrations) {
            this.props.updateIntegrationsSettings(integrations);
        }

        if (runSettings) {
            this.props.updateRunSettings(runSettings);
        }
    }
    settingsDialog_onCancel() {
        this.props.hideDialog('DIALOG_SETTINGS');
    }

    chromeDrivers_onSubmit = (chromeDriverVersion) => {
        this.props.hideDialog('DIALOG_INCORECT_CHROME_DRIVER_VERSION');
        this.props.startDownloadChromeDriver(chromeDriverVersion);
    }

    chromeDrivers_onCancel = () => {
        this.props.hideDialog('DIALOG_INCORECT_CHROME_DRIVER_VERSION');
    }

    chromeDriversSuccess_onClose = () => {
        this.props.hideDialog('DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS');
    }

    chromeDriversFailed_onClose = () => {
        this.props.hideDialog('DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED');
    }
    
    chromeDrivers_onNoChromeDriverSubmit = () => {
        this.props.hideDialog('DIALOG_INCORECT_CHROME_DRIVER_VERSION');
        this.props.showDownloadChromeDriverError();
    }

    edgeDrivers_onSubmit = (edgeDriverVersion) => {
        this.props.hideDialog('DIALOG_INCORECT_EDGE_DRIVER_VERSION');
        this.props.startDownloadEdgeDriver(edgeDriverVersion);
    }

    edgeDrivers_onCancel = () => {
        this.props.hideDialog('DIALOG_INCORECT_EDGE_DRIVER_VERSION');
    }

    edgeDriversSuccess_onClose = () => {
        this.props.hideDialog('DIALOG_DOWNLOADING_EDGE_DRIVER_SUCCESS');
    }

    edgeDriversFailed_onClose = () => {
        this.props.hideDialog('DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED');
    }
    
    edgeDrivers_onNoEdgeDriverSubmit = () => {
        this.props.hideDialog('DIALOG_INCORECT_EDGE_DRIVER_VERSION');
        this.props.showDownloadEdgeDriverError();
    }

    encryptDecryptDialogOnAction = (action) => {
        this.props.encryptDecryptDialogOnAction(action);
    }

    encryptDecryptDialogOnCancel = () => {
        this.props.hideDialog('DIALOG_CRYPTO_ENCRYPT_DECRYPT');
    }
    
    render() {
        const { 
            test, 
            settings = {}, 
            dialog, 
            javaError, 
            xCodeError, 
            isAndroidHomeError,
            initialized, 
            changeShowRecorderMessageValue, 
            cleanJavaError, 
            cleanXCodeError,
            cleanAndroidHomeError,
            objrepoPath,
            editorActiveFile,
            editorActiveFilePossibleRepoPath,
            objrepoName,
            changeShowShowAndroidHomeError
        } = this.props;

        const {
            generalSettings = {},
            runSettings = {},
            integrations = {},
            cloudProviders = {},
            cloudProvidesBrowsersAndDevices = null,
            projectSettings = null,
            hideAndroidHomeError = null
        } = settings;
        const { runtimeSettings } = test;
        // sidebars state
        const leftSidebarSize = settings.sidebars.left.size;
        const leftSidebarVisible = settings.sidebars.left.visible;
        const rightSidebarSize = settings.sidebars.right.size;
        const rightSidebarVisible = settings.sidebars.right.visible;
        const rightSidebarComponent = settings.sidebars.right.component;

        // logger state
        const loggerVisible = settings.logger.visible;
        const showRecorderMessage = settings.showRecorderMessage;

        // convert providers dictionary to an array - add only providers marked as 'in use'
        const providers = [];
        for (var providerKey of Object.keys(cloudProviders)) {
            const provider = cloudProviders[providerKey];
            if (provider.inUse) {
                providers.push({
                    ...cloudProviders[providerKey],
                    id: providerKey
                });
            }      
        }
            
        if (!initialized) {
            return (
                <Initializing/>
            );
        }

        return (
            <div>
                { 
                    javaError && 
                    <JavaDialog 
                        clean={cleanJavaError}
                        javaError={javaError}
                    />  
                }
                { 
                    xCodeError && 
                    <XCodeDialog 
                        clean={cleanXCodeError}
                        xCodeError={xCodeError}
                    />
                }
                {
                    isAndroidHomeError &&
                    <AndroidHomeErrorDialog
                        clean={cleanAndroidHomeError}
                        hideAndroidHomeError={hideAndroidHomeError}
                        changeShowShowAndroidHomeError={changeShowShowAndroidHomeError}
                    />
                }
                {
                    dialog && 
                    <Fragment>
                        { 
                            dialog.DIALOG_FILE_CREATE && dialog.DIALOG_FILE_CREATE.visible &&
                            <FileCreateDialog 
                                { ...dialog['DIALOG_FILE_CREATE'] }
                                onSubmit={ ::this.fileCreateDialog_onSubmit }
                                onCancel={ ::this.fileCreateDialog_onCancel } 
                            />
                        }
                        {
                            dialog.DIALOG_NEED_ISTALL_EXTENSION && dialog.DIALOG_NEED_ISTALL_EXTENSION.visible &&
                            <NeedInstallExtension
                                onClose={ this.needInstallExtensionOnClose }
                            />
                        }
                        <ObjectElementCreateDialog
                            { ...dialog['DIALOG_OBJECT_ELEMENT_CREATE'] }
                            onSubmit={ ::this.objectElementCreateDialog_onSubmit }
                            onCancel={ ::this.objectElementCreateDialog_onCancel } 
                        />
                        <ObjectContainerCreateDialog
                            { ...dialog['DIALOG_OBJECT_CONTAINER_CREATE'] }
                            onSubmit={ ::this.objectContainerCreateDialog_onSubmit }
                            onCancel={ ::this.objectContainerCreateDialog_onCancel } 
                        />
                        { 
                            dialog.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME && dialog.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME.visible &&
                            <ObjectElementOrContainerRenameDialog
                                { ...dialog['DIALOG_OBJECT_ELEMENT_OR_CONTAINER_RENAME'] }
                                onSubmit={ ::this.objectElementRenameDialog_onSubmit }
                                onCancel={ ::this.objectElementRenameDialog_onCancel }
                            />
                        }
                        {
                            dialog.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE && dialog.DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE.visible &&
                            <ObjectElementOrContainerRemoveDialog
                                { ...dialog['DIALOG_OBJECT_ELEMENT_OR_CONTAINER_REMOVE'] }
                                onSubmit={ ::this.objectElementRemoveDialog_onSubmit }
                                onCancel={ ::this.objectElementRemoveDialog_onCancel }
                            />
                        }
                        {
                            dialog.DIALOG_FILE_CREATE && dialog.DIALOG_FILE_CREATE.visible &&
                            <FileCreateDialog 
                                { ...dialog['DIALOG_FILE_CREATE'] }
                                onSubmit={ ::this.fileCreateDialog_onSubmit }
                                onCancel={ ::this.fileCreateDialog_onCancel } 
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_EDGE_DRIVER && dialog.DIALOG_DOWNLOADING_EDGE_DRIVER.visible &&
                            <EdgeDriverDownloadingDialog
                                { ...dialog['DIALOG_DOWNLOADING_EDGE_DRIVER'] }
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_EDGE_DRIVER_SUCCESS && dialog.DIALOG_DOWNLOADING_EDGE_DRIVER_SUCCESS.visible &&
                            <EdgeDriverDownloadingSuccessDialog
                                { ...dialog['DIALOG_DOWNLOADING_EDGE_DRIVER_SUCCESS'] }
                                onClose={ this.edgeDriversSuccess_onClose  }
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED && dialog.DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED.visible &&
                            <EdgeDriverDownloadingFailedDialog
                                { ...dialog['DIALOG_DOWNLOADING_EDGE_DRIVER_FAILED'] }
                                onClose={ this.edgeDriversFailed_onClose  }
                            />
                        }
                        {
                            dialog.DIALOG_INCORECT_EDGE_DRIVER_VERSION && dialog.DIALOG_INCORECT_EDGE_DRIVER_VERSION.visible &&
                            <EdgeDriverDialog
                                { ...dialog['DIALOG_INCORECT_EDGE_DRIVER_VERSION'] }
                                onSubmit={ this.edgeDrivers_onSubmit }
                                onCancel={ this.edgeDrivers_onCancel }
                                onNoChromeDriverSubmit={ this.edgeDrivers_onNoChromeDriverSubmit }
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_CHROME_DRIVER && dialog.DIALOG_DOWNLOADING_CHROME_DRIVER.visible &&
                            <ChromeDriverDownloadingDialog
                                { ...dialog['DIALOG_DOWNLOADING_CHROME_DRIVER'] }
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS && dialog.DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS.visible &&
                            <ChromeDriverDownloadingSuccessDialog
                                { ...dialog['DIALOG_DOWNLOADING_CHROME_DRIVER_SUCCESS'] }
                                onClose={ this.chromeDriversSuccess_onClose  }
                            />
                        }
                        {
                            dialog.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED && dialog.DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED.visible &&
                            <ChromeDriverDownloadingFailedDialog
                                { ...dialog['DIALOG_DOWNLOADING_CHROME_DRIVER_FAILED'] }
                                onClose={ this.chromeDriversFailed_onClose  }
                            />
                        }
                        {
                            dialog.DIALOG_INCORECT_CHROME_DRIVER_VERSION && dialog.DIALOG_INCORECT_CHROME_DRIVER_VERSION.visible &&
                            <ChromeDriverDialog
                                { ...dialog['DIALOG_INCORECT_CHROME_DRIVER_VERSION'] }
                                onSubmit={ this.chromeDrivers_onSubmit }
                                onCancel={ this.chromeDrivers_onCancel }
                                onNoChromeDriverSubmit={ this.chromeDrivers_onNoChromeDriverSubmit }
                            />
                        }
                        <FileRenameDialog 
                            { ...dialog['DIALOG_FILE_RENAME'] } 
                            onSubmit={ ::this.fileRenameDialog_onSubmit }
                            onCancel={ ::this.fileRenameDialog_onCancel } 
                        />
                        { 
                            dialog.DIALOG_SETTINGS && dialog.DIALOG_SETTINGS.visible &&
                            <SettingsDialog 
                                { ...dialog['DIALOG_SETTINGS'] } 
                                settings={ runtimeSettings }
                                projectSettings={ projectSettings }
                                cloudProviders={ cloudProviders }
                                integrations={ integrations }
                                runSettings={ runSettings }
                                generalSettings={ generalSettings }
                                onSubmit={ ::this.settingsDialog_onSubmit }
                                onCancel={ ::this.settingsDialog_onCancel } 
                            />
                        }
                        <UpdateDialog
                            { ...dialog['DIALOG_UPDATE'] }
                            onSubmit={ ::this.updateDialog_onSubmit }
                            onCancel={ ::this.updateDialog_onCancel }
                        />
                        {
                            dialog.DIALOG_CRYPTO_ENCRYPT_DECRYPT &&
                            dialog.DIALOG_CRYPTO_ENCRYPT_DECRYPT.visible &&
                            <EncryptDecryptDialog
                                { ...dialog['DIALOG_CRYPTO_ENCRYPT_DECRYPT'] }
                                onAction={ this.encryptDecryptDialogOnAction }
                                onCancel={ this.encryptDecryptDialogOnCancel }
                            />
                        }
                    </Fragment>
                }
                {updateModals.call(this)}
                <Toolbar
                    testRunning={ test.isRunning }
                    canRecord={ this.props.canRecord }
                    isChromeExtensionEnabled={ this.props.isChromeExtensionEnabled }
                    waitChromeExtension={ this.props.waitChromeExtension }
                    stopWaitChromeExtension={ this.props.stopWaitChromeExtension }
                    testMode={ runtimeSettings.testMode }
                    testTarget={ runtimeSettings.testTarget }
                    testProvider={ runtimeSettings.testProvider }
                    stepDelay={ runtimeSettings.stepDelay }
                    devices={ test.devices }
                    browsers={ test.browsers }
                    emulators={ test.emulators }
                    providers={ providers }
                    cloudProvidesBrowsersAndDevices={ cloudProvidesBrowsersAndDevices }
                    showRecorderMessage={ showRecorderMessage }
                    changeShowRecorderMessageValue={ changeShowRecorderMessageValue }
                    controlsState={ this.getToolbarControlsState() } 
                    onButtonClick={ ::this.handleToolbarButtonClick }
                    onValueChange={ ::this.handleToolbarValueChange }
                />
                <Row style={{ display: 'flex' }}>
                    <Col style={{ display: 'none' }} className="sideNavClass">
                        <Navbar />
                    </Col>
                    <Col style={{ width: '100%' }}>
                        <Layout className="ide-main">
                            <Sidebar 
                                align="left"
                                size={ leftSidebarSize } 
                                visible={ leftSidebarVisible } 
                                onResize={ (size) => ::this.handleSidebarResize('left', size) }
                            >
                                <FileExplorer 
                                    onSelect={ ::this.fileExplorer_onSelect } 
                                    onCreate={ ::this.fileExplorer_onCreate }
                                    onRename={ ::this.fileExplorer_onRename }
                                    onMove={ ::this.fileExplorer_onMove }
                                />
                            </Sidebar>
                            <Layout className="ide-editors">
                                <Header className="tabs-container">
                                    <Row>
                                        <Col className="sidebar-trigger">                      
                                            <Icon
                                                title={!leftSidebarVisible ? 'Show tree' : 'Hide tree'}
                                                className="trigger"
                                                type={!leftSidebarVisible ? 'menu-unfold' : 'menu-fold'}
                                                onClick={ () => ::this.toggleSidebarVisible('left') }
                                                style={{ paddingLeft: 15, cursor: 'pointer' }}
                                            />
                                        </Col>
                                        <Col className="tabs-bar-container">
                                            <Tabs 
                                                onChange={ this.handleTabChange } 
                                                onClose={ this.handleTabClose } 
                                            />
                                        </Col>
                                        {
                                            objrepoPath && editorActiveFile && editorActiveFilePossibleRepoPath && objrepoPath === editorActiveFilePossibleRepoPath &&
                                            <Col className="sidebar-trigger">                      
                                                <Icon
                                                    title={!rightSidebarVisible ? 'Show Object Repository' : 'Hide Object Repository'}
                                                    className="trigger"
                                                    type={!rightSidebarVisible ? 'menu-unfold' : 'menu-fold'}
                                                    onClick={ () => ::this.toggleSidebarVisible('right') }
                                                    style={{ paddingLeft: 15, cursor: 'pointer', transform: 'rotate(180deg)' }}
                                                />
                                            </Col>
                                        }
                                    </Row>
                                </Header>
                                <div className="editor-container">
                                    <div id="editors-container-wrap">
                                        <TextEditor
                                            onBreakpointsUpdate={::this.handleBreakpointsUpdate}
                                            onContentUpdate={::this.handleFileContentUpdate}
                                        />
                                    </div>
                                    <Logger
                                        visible={loggerVisible}
                                        onHide={::this.logger_onHide}
                                        variables={ test.variables }
                                    />
                                </div>
                            </Layout>
                            {
                                rightSidebarComponent === 'settings' && 
                                <Sidebar 
                                    align="right"
                                    size={ rightSidebarSize } 
                                    visible={ rightSidebarVisible } 
                                    onResize={ (size) => ::this.handleSidebarResize('right', size) }
                                >
                                    <Settings />
                                </Sidebar>
                            }
                            {
                                objrepoName &&
                                <Sidebar 
                                    align="right"
                                    size={ rightSidebarSize } 
                                    visible={ rightSidebarVisible } 
                                    onResize={ (size) => ::this.handleSidebarResize('right', size) }
                                >
                                    { rightSidebarComponent === 'obj-repo' && <ObjectRepository /> } 
                                    { rightSidebarComponent === 'obj-repo-not-valid' && <ObjectRepositoryNotValid /> } 
                                </Sidebar>
                            }
                        </Layout>
                    </Col>
                </Row>
          </div>
      );
  }
}
