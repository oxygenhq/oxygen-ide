/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import React from 'react';
import path from 'path';
import { loadWASM } from 'onigasm';
import { Registry } from 'monaco-textmate';
import { wireTmGrammars } from 'monaco-editor-textmate';
import deepDiff from 'deep-diff';
import oxygenIntellisense from './intellisense';
import { language as jsTokenizer } from './tokenizers/javascript'; 
import * as helpers from './helpers';
import onDidChangeModelContent from './onDidChangeModelContent';
import onDidChangeCursorSelection from './onDidChangeCursorSelection';

const RATIO = 1.58;
const DEFAULT_FONT_SIZE = 12;
const FONT_SIZE_MIN = 12;
const FONT_SIZE_MAX = 36;

function noop() {}

const EDITOR_CONTAINER_CLASS_NAME = 'monaco-editor-container';
const EDITOR_ACTION_FIND = 'actions.find';
const EDITOR_ACTION_REPLACE = 'editor.action.startFindReplaceAction'; 

const INTELLISENSE_ON_OPTIONS = {
    showClasses: true,
    showColors: true,
    showConstants: true,
    showConstructors: true,
    showEnumMembers: true,
    showEnums: true,
    showEvents: true,
    showFields: true,
    showFiles: false,
    showFolders: true,
    showFunctions: true,
    showIcons: true,
    showInlineDetails: true,
    showInterfaces: true,
    showIssues: true,
    showKeywords: true,
    showMethods: true,
    showModules: true,
    showOperators: true,
    showProperties: true,
    showReferences: true,
    showSnippets: true,
    showStatusBar: true,
    showStructs: true,
    showTypeParameters: true,
    showUnits: true,
    showUsers: true,
    showValues: true,
    showVariables: true,
    showWords: true
};

const INTELLISENSE_OFF_OPTIONS = {
    showClasses: false,
    showColors: false,
    showConstants: false,
    showConstructors: false,
    showEnumMembers: false,
    showEnums: false,
    showEvents: false,
    showFields: false,
    showFiles: false,
    showFolders: false,
    showFunctions: false,
    showIcons: false,
    showInlineDetails: false,
    showInterfaces: false,
    showIssues: false,
    showKeywords: false,
    showMethods: false,
    showModules: false,
    showOperators: false,
    showProperties: false,
    showReferences: false,
    showSnippets: false,
    showStatusBar: false,
    showStructs: false,
    showTypeParameters: false,
    showUnits: false,
    showUsers: false,
    showValues: false,
    showVariables: false,
    showWords: false
};

const MONACO_DEFAULT_OPTIONS = {
    fontSize: '12pt',
    lineHeight: 19,
    fontFamily: 'Fira Code',
    fontLigatures: true,
    automaticLayout: true,
    minimap: {
        enabled: false,
    },
    theme: 'oxygen-theme'
};

type Props = {
    activeLine: number | null,
    breakpoints: Array,
    disabledBreakpoints: Array,
    resolvedBreakpoints: Array,
    visible: boolean,
    editorReadOnly: boolean,
    fontSize: number,
    width: string | number,
    height: string | number,
    value: string,
    defaultValue: string,
    language: string,
    theme: string,
    filePath: string,
    fileName: string,
    options: object,
    waitUpdateBreakpoints: boolean,
    featureLanguageLoaded: boolean,
    useIntellisense: boolean,
    editorDidMount: Function,
    editorWillMount: Function,
    onValueChange: Function,
    onSelectionChange: Function,
    onBreakpointsUpdate: Function,
    setFatureLanguageLoaded: Function,
    handleMainMenuEvent: Function
};

export default class MonacoEditor extends React.Component<Props> {

    constructor(props) {
        super(props);
        this.editorContainer = undefined;
        this.__current_value = props.value;
        this.elem = null;

        this.state = {
            // editorClass holds an optional class name which will be added to editor's container DIV 
            editorClasses: [],
        };
    }

    componentDidMount() {
        try {
            this.initMonaco();
        } catch (e) {
            console.log('monaco editor e', e);
        }

        this.elem = document.getElementById('editors-container-wrap');
        this.elem.addEventListener('addContentEvent', (event) => {            
            const {
                filePath,
                fileName,
            } = this.props;

            if (
                filePath &&
                event.detail && 
                event.detail.filePath && 
                (filePath === event.detail.filePath || filePath+fileName === event.detail.filePath) && 
                this.editor && 
                this.editor.getModel()
            ) {
                
                this.editor.getModel().applyEdits([{
                    range: monaco.Range.fromPositions(this.editor.getPosition()),
                    text: event.detail.generatedCode
                }]);
            }
        });
    }

    shouldComponentUpdate(nextProps, nextState) {    
        const propsStatus = this.determineUpdatedProps(nextProps);
        // return true if one or more properties has been updated
        const shouldUpdate = Object.keys(propsStatus).reduce( (sum, nextKey) => sum || propsStatus[nextKey], false);
        return shouldUpdate;
    }

    componentDidUpdate(prevProps) {
        let updateFontSize = false;
        let updateActiveLine = false;

        const propsDiff = deepDiff(prevProps, this.props);

        if (prevProps.fontSize !== this.props.fontSize && this.editor) {
            updateFontSize = this.props.fontSize;

            // update editor
            this.editor.updateOptions({ 
                fontSize: this.props.fontSize,
                lineHeight: this.props.fontSize*RATIO
            });
        }

        if (this.props.value !== this.__current_value && propsDiff) {
            // Always refer to the latest value
            this.__current_value = this.props.value;
            // Consider the situation of rendering 1+ times before the editor mounted
            if (this.editor) {
                this.__prevent_trigger_change_event = true;
                this.editor.setValue(this.__current_value);
                this.__prevent_trigger_change_event = false;
            }
        }
        if (prevProps.language !== this.props.language) {
            monaco.editor.setModelLanguage(this.editor.getModel(), this.props.language);
        }

        if (prevProps.editorReadOnly !== this.props.editorReadOnly && this.editor) {
            this.editor.updateOptions({ readOnly: this.props.editorReadOnly });
        }
        
        if (prevProps.waitUpdateBreakpoints !== this.props.waitUpdateBreakpoints && this.editor) {
            if (this.props.waitUpdateBreakpoints) {
                helpers.makeBreakpointsHalfOpacity(this.editor);
            } else {
                helpers.makeBreakpointsFullOpacity(this.editor);
            }
        }

        if (deepDiff(prevProps.disabledBreakpoints, this.props.disabledBreakpoints)) {
            helpers.makeBreakpointsHollowCircle(this.editor, this.props.disabledBreakpoints);
        }
        if (deepDiff(prevProps.resolvedBreakpoints, this.props.resolvedBreakpoints)) {
            if (
                this.props.resolvedBreakpoints &&
                Array.isArray(this.props.resolvedBreakpoints) &&
                this.props.resolvedBreakpoints.length > 0
            ) {
                this.props.resolvedBreakpoints.map((item) => {
                    helpers.addBreakpointMarker(this.editor, item, this.props.fontSize, this.props.disabledBreakpoints, this.props.resolvedBreakpoints);
                });
            } else {
                helpers.makeBreakpointsResolwedCircle(this.editor, this.props.resolvedBreakpoints);
            }
        }        
        
        if (prevProps.activeLine !== this.props.activeLine) {
            const { activeLine } = this.props;
            // scroll view into the current active line
            if (activeLine && Number.isInteger(activeLine)) {
                this.editor.revealLineInCenter(activeLine);
            }
            // set current line marker or clear it if activeLine is null
            updateActiveLine = activeLine;
        }
        if (prevProps.theme !== this.props.theme) {
            monaco.editor.setTheme(this.props.theme);
        }
        if (
            this.editor &&
            (this.props.width !== prevProps.width || this.props.height !== prevProps.height)
        ) {
            this.editor.layout();
        }
        else if (this.editor && this.props.visible == true && this.props.visible != prevProps.visible) {
            this.editor.layout();
        }

        if (typeof updateActiveLine !== 'boolean' && updateFontSize) {
            //update ActiveLine and FontSize
            helpers.updateActiveLineMarker(this.editor, updateActiveLine, updateFontSize);
        } else if (typeof updateActiveLine !== 'boolean') {
            //update ActiveLine
            helpers.updateActiveLineMarker(this.editor, updateActiveLine, this.props.fontSize);
        } else if (updateFontSize) {
            //update FontSize
            const { activeLine } = this.props;
            helpers.updateActiveLineMarker(this.editor, activeLine, updateFontSize);
        }

        if (updateFontSize) {
            if (this.ln && Array.isArray(this.ln)) {
                this.ln.map((item) => {
                    helpers.addBreakpointMarker(this.editor, item, updateFontSize, this.props.disabledBreakpoints, this.props.resolvedBreakpoints);
                });
            }

            
            if (this.props.resolvedBreakpoints && Array.isArray(this.props.resolvedBreakpoints)) {
                this.props.resolvedBreakpoints.map((item) => {
                    helpers.addBreakpointMarker(this.editor, item, updateFontSize, this.props.disabledBreakpoints, this.props.resolvedBreakpoints);
                });
            }
        }

        if (prevProps.useIntellisense !== this.props.useIntellisense) {
            let suggest;
            if (this.props.useIntellisense) {
                suggest = INTELLISENSE_ON_OPTIONS;
            } else { 
                suggest = INTELLISENSE_OFF_OPTIONS;
            }
            this.editor.updateOptions({ suggest: suggest });
        }
    }

    componentWillUnmount() {
        this.destroyMonaco();

        if (this.elem) {
            this.elem.removeEventListener('addContentEvent', () => {});
        }
    }
    
    addLnToLnArray(ln) {
        if (this.ln && Array.isArray(this.ln)) {
            this.ln.push(ln);
        } else {
            this.ln = [ln];
        }
    }

    removeLnfromLnArray(ln) {
        if (ln && this.ln && Array.isArray(this.ln)) {
            this.ln = this.ln.filter((item) => {
                return item !== ln;
            });
        }
    }  

    determineUpdatedProps(diffProps) {
        return {
        // prevent re-render when editor's value property is changed by onDidChangeModelContent event
        // otherwise, we will have an unneccessary call to editor.setValue (in componentDidUpdate)
        // and duplicated render
            value:
            this.editor ?
                diffProps.value !== this.props.value &&
            diffProps.value !== this.editor.getValue() : false,
            lang:
            diffProps.language !== this.props.language,
            activeLine:
            diffProps.activeLine !== this.props.activeLine,
            theme:
            diffProps.theme !== this.props.theme,
            size:
            this.props.width !== diffProps.width || this.props.height !== diffProps.height,
            visible:
            this.props.visible !== diffProps.visible,
            editorReadOnly:
            diffProps.editorReadOnly !== this.props.editorReadOnly,
            fontSize:
            diffProps.fontSize !== this.props.fontSize,
            waitUpdateBreakpoints:
            diffProps.waitUpdateBreakpoints !== this.props.waitUpdateBreakpoints,
            disabledBreakpoints: 
            diffProps.disabledBreakpoints !== this.props.disabledBreakpoints,
            resolvedBreakpoints:
            diffProps.resolvedBreakpoints !== this.props.resolvedBreakpoints,
            useIntellisense:
            diffProps.useIntellisense !== this.props.useIntellisense,
        };
    }

    editorWillMount() {
        const { editorWillMount } = this.props;
        editorWillMount(monaco);
    }

    editorDidMount(editor) {
        this.editor.layout();

        if (this.props.fontSize && this.props.breakpoints && Array.isArray(this.props.breakpoints) && this.props.breakpoints.length > 0) {     
            this.props.breakpoints.map((item) => {
                helpers.addBreakpointMarker(this.editor, item, this.props.fontSize, this.props.disabledBreakpoints, this.props.resolvedBreakpoints);
            });
        }

        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_L, () => {
            this.props.handleMainMenuEvent('MENU_CMD_VIEW_EVENT_LOG');
        });
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KEY_I, () => {
            // do nothing, to avoid double execution
        });
    }

    trigger(trigger) {
        // make sure we react to the external trigger only with the editor has a focus (e.g. cursor is blinking inside the editor)
        if (this.editor && trigger && this.editor.hasTextFocus()) {
            if (trigger === 'undo') {
                this.editor.getModel().undo();
            }
            else if (trigger === 'redo') {
                this.editor.getModel().redo();
            }
            else if (trigger === 'find') {
                this.editor.getAction(EDITOR_ACTION_FIND).run();
            }
            else if (trigger === 'replace') {
                this.editor.getAction(EDITOR_ACTION_REPLACE).run();
            }
        }
    }

    async liftOff() {
        try {
            const { featureLanguageLoaded, setFatureLanguageLoaded } = this.props;
            if (!featureLanguageLoaded) {
                // see https://www.npmjs.com/package/onigasm#light-it-up
                await loadWASM(process.env.NODE_ENV === 'development' ?
                    path.join(__dirname, '../../node_modules/onigasm/lib/onigasm.wasm') :
                    require('onigasm/lib/onigasm.wasm'));
            
                const registry = new Registry({
                    getGrammarDefinition: async (scopeName) => {
                        return {
                            format: 'plist',
                            content: await (await fetch('./components/MonacoEditor/cucumber/feature.tmLanguage')).text()
                        };
                    }
                });
            
                // map of monaco "language id's" to TextMate scopeNames
                const grammars = new Map();
                grammars.set('feature', 'feature.feature');
            
                await wireTmGrammars(monaco, registry, grammars);
                setFatureLanguageLoaded();
            }
        } catch (e) {
            console.log('liftOff error', e);
        }
    }

    async initMonaco() {
        const value = this.props.value !== null ? this.props.value : this.props.defaultValue;
        const { language, theme, fontSize, featureLanguageLoaded, useIntellisense } = this.props;

        let saveFontSize = DEFAULT_FONT_SIZE;

        if (
            fontSize &&
            parseInt(fontSize) &&
            fontSize >= FONT_SIZE_MIN && 
            fontSize <= FONT_SIZE_MAX
        ) {
            saveFontSize = fontSize;
        }

        if (this.editorContainer) {
            // Before initializing monaco editor
            this.editorWillMount();
            
            if (language && typeof language === 'string' && language === 'feature' && !featureLanguageLoaded) {
                monaco.languages.register({ 
                    id: 'feature',
                    aliases: [
                        'Gherkin',
                        'feature'
                    ],
                    extensions: [
                        '.feature'
                    ]
                });
    
                await this.liftOff();
    
                monaco.languages.onLanguage('feature', () => {    
                    monaco.languages.setLanguageConfiguration('feature', {
                        comments: {
                            lineComment: '#'
                        }
                    });
                });
            }

            // workaround for not being able to override or extend existing tokenziers
            // https://github.com/Microsoft/monaco-editor/issues/252
            monaco.languages.onLanguage('javascript', () => {
                // waits til after monaco tries to register things itself
                setTimeout(() => {
                    monaco.languages.setMonarchTokensProvider('javascript', jsTokenizer);
                }, 1000);
            });

            monaco.editor.defineTheme('oxygen-theme', {
                base: 'vs', // can also be vs-dark or hc-black
                inherit: true,
                rules: [
                    { token: 'ox.transaction', foreground: '314496', fontStyle: 'bold' }
                ]
            });

            let suggest;
            if (useIntellisense) {
                suggest = INTELLISENSE_ON_OPTIONS;
            } else { 
                suggest = INTELLISENSE_OFF_OPTIONS;
            }

            this.editor = monaco.editor.create(this.editorContainer, {
                value,
                language,
                ...MONACO_DEFAULT_OPTIONS,
                fontSize: saveFontSize,
                lineHeight: saveFontSize*RATIO,
                suggest: suggest
            });
            oxygenIntellisense();
            if (theme) {
                monaco.editor.setTheme(theme);
            }
            this.hookToEditorEvents();
            // After initializing monaco editor
            this.editorDidMount(this.editor);
        }
    }

    destroyMonaco() {
        if (typeof this.editor !== 'undefined') {
            this.editor.dispose();
        }
    }

    onBreakpointsUpdate = (bps) => {
        const {
            filePath,
            fileName
        } = this.props;

        this.props.onBreakpointsUpdate(filePath, bps, fileName);
    }

    onValueChange = (bps) => {
        const {
            filePath,
            fileName
        } = this.props;

        this.props.onValueChange(filePath, bps, fileName);
    }

    onSelectionChange = (bps) => {
        const {
            filePath
        } = this.props;

        this.props.onSelectionChange(filePath, bps);
    }

    /**
     * Watching click events
     */
    hookToEditorEvents = () => {
        const { language } = this.props;
        const editor = this.editor;

        editor.onDidChangeModelContent(onDidChangeModelContent.bind(this));
        editor.onDidChangeCursorSelection(onDidChangeCursorSelection.bind(this));

        editor.onMouseDown((e) => {
            const { target: { element, position } } = e;

            if (
                element.className &&
                element.className.includes &&
                element.className.includes('line-numbers') &&
                language !== 'feature'
            ) {
                // select the entire line if the user clicks on line number panel
                const ln = position.lineNumber;
                editor.setSelection(new monaco.Selection(1, 2, 1, 2));
                editor.focus();

                const marker = helpers.getBreakpointMarker(editor, ln);
                const { waitUpdateBreakpoints } = this.props;

                if (waitUpdateBreakpoints) {
                    //ignored
                    console.warn('Breakpoint cannot be added before previous breackpoint adding finished');
                } else {
                    // if user clicks on line-number panel, handle it as adding or removing a breakpoint at this line
                    if (editor.getModel().getLineContent(ln).trim().length > 0) {
                        if (!marker) {
                            if (helpers.addBreakpointMarker(editor, ln, this.props.fontSize, this.props.disabledBreakpoints, this.props.resolvedBreakpoints)) {
                                this.addLnToLnArray(ln);
                                this.onBreakpointsUpdate(helpers.breakpointMarkersToLineNumbers(editor));
                            }
                        }
                        else {
                            if (helpers.removeBreakpointMarker(editor, ln)) {
                                this.removeLnfromLnArray(ln);
                                this.onBreakpointsUpdate(helpers.breakpointMarkersToLineNumbers(editor));
                            }
                        }
                    } else {
                        if (!marker) {
                            console.warn('Breakpoint cannot be added at the empty line.');
                        } else {
                            if (helpers.removeBreakpointMarker(editor, ln)) {
                                this.removeLnfromLnArray(ln);
                                this.onBreakpointsUpdate(helpers.breakpointMarkersToLineNumbers(editor));
                            }
                        }
                    }
                }
            }
        });
    }

    assignRef = (component) => {
        this.editorContainer = component;
    };

    render() {
        const { width, height, visible } = this.props;
        const { editorClasses } = this.state;
        const fixedWidth = width.toString().indexOf('%') !== -1 ? width : `${width}px`;
        const fixedHeight = height.toString().indexOf('%') !== -1 ? height : `${height}px`;
        const style = {
            width: fixedWidth,
            height: fixedHeight,
            display: visible ? 'block' : 'none',
        };
        const classNames = [
            EDITOR_CONTAINER_CLASS_NAME,
            ...editorClasses,
        ].join(' ');
        return <div ref={this.assignRef} style={style} className={ classNames } />;
    }
}

MonacoEditor.defaultProps = {
    visible: true,
    editorReadOnly: false,
    fontSize: 12,
    width: '100%',
    height: '100%',
    value: null,
    defaultValue: '',
    language: 'javascript',
    theme: 'oxygen-theme',
    options: {},
    editorDidMount: noop,
    editorWillMount: noop,
    onValueChange: noop,
    onSelectionChange: noop,
    onBreakpointsUpdate: noop,
};
