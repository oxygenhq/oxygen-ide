/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React from 'react';
import { Button, Input, Tooltip } from 'antd';
import { CloseOutlined, DownOutlined, RightOutlined, UndoOutlined } from '@ant-design/icons';
import SearchResults from './SearchResults.jsx';
import '../../css/search.scss';

const MIN_HEIGHT = 160;
const DEFAULT_HEIGHT = 330;
// same as in the Logger: room that is always kept for the toolbar, tabs bar and a usable editor area
const TOP_UI_RESERVED_HEIGHT = 230;
const LOGGER_MIN_HEIGHT = 200;

type Props = {
    search: Object,
    rootPath: string | null,
    rootName: string | null,
    loggerVisible: boolean,
    hideSearch: Function,
    setSearchOptions: Function,
    runSearch: Function,
    replaceInFiles: Function,
    openSearchMatch: Function,
    dismissSearchFile: Function
};

const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

export default class SearchPanel extends React.PureComponent<Props> {
    props: Props;

    state = {
        dragFlag: false,
        panelHeight: DEFAULT_HEIGHT,
        // files which results are folded
        collapsed: {}
    };

    componentDidMount() {
        window.addEventListener('mouseup', this.handleMouseUp);
        window.addEventListener('mousemove', this.handleDrag);
        window.addEventListener('resize', this.handleWindowResize);
    }

    componentDidUpdate(prevProps: Props) {
        // the panel was requested again (e.g. with Ctrl+Shift+F), so move the cursor to the search field
        if (this.props.search.focusToken !== prevProps.search.focusToken && this.queryRef.current) {
            this.queryRef.current.focus({ cursor: 'all' });
        }
        // a new search was started, so the folded state of the previous results is not valid anymore
        if (this.props.search.isSearching && !prevProps.search.isSearching && Object.keys(this.state.collapsed).length > 0) {
            this.setState({ collapsed: {} });
        }
    }

    componentWillUnmount() {
        window.removeEventListener('mouseup', this.handleMouseUp);
        window.removeEventListener('mousemove', this.handleDrag);
        window.removeEventListener('resize', this.handleWindowResize);
    }

    // search field, focused when the panel is requested
    queryRef = React.createRef();

    getMaxHeight() {
        const loggerHeight = this.props.loggerVisible ? LOGGER_MIN_HEIGHT : 0;
        return Math.max(MIN_HEIGHT, window.innerHeight - TOP_UI_RESERVED_HEIGHT - loggerHeight);
    }

    handleMouseDown = () => {
        this.setState({ dragFlag: true });
    };

    handleMouseUp = () => {
        if (this.state.dragFlag) {
            this.setState({ dragFlag: false });
        }
    };

    handleDrag = (e: MouseEvent) => {
        if (!this.state.dragFlag || !this.rootElement) {
            return;
        }
        // the panel's bottom edge is where its container ends, so its height is the distance from the pointer to that edge
        const bottom = this.rootElement.getBoundingClientRect().bottom;
        const height = Math.min(this.getMaxHeight(), Math.max(MIN_HEIGHT, bottom - e.pageY));
        this.setState({ panelHeight: height });
    };

    handleWindowResize = () => {
        if (this.state.panelHeight > this.getMaxHeight()) {
            this.setState({ panelHeight: this.getMaxHeight() });
        }
    };

    setOption = (options: Object, rerun: boolean = false) => {
        this.props.setSearchOptions(options);
        if (rerun && this.props.search.query) {
            this.props.runSearch();
        }
    };

    handleToggleOption = (name: string) => {
        this.setOption({ [name]: !this.props.search[name] }, true);
    };

    handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            this.props.hideSearch();
        }
    };

    handleToggle = (path: string) => {
        this.setState({ collapsed: { ...this.state.collapsed, [path]: !this.state.collapsed[path] } });
    };

    handleOpenMatch = (path: string, match: Object) => {
        this.props.openSearchMatch(path, match.line, match.column, match.length);
    };

    handleReplaceFile = (path: string) => {
        this.props.replaceInFiles([path]);
    };

    handleReplaceAll = () => {
        this.props.replaceInFiles();
    };

    handleResetFolder = () => {
        this.setOption({ folder: this.props.rootPath }, true);
    };

    renderToggle(name: string, label: string, title: string) {
        const active = this.props.search[name];
        return (
            <Tooltip title={ title }>
                <button
                    type="button"
                    className={ `search-toggle ${active ? 'active' : ''}` }
                    onClick={ () => this.handleToggleOption(name) }
                >{ label }</button>
            </Tooltip>
        );
    }

    renderStatus() {
        const {
            isSearching,
            isReplacing,
            hasSearched,
            error,
            notice,
            query,
            totalMatches,
            totalFiles,
            truncated,
            skippedFiles
        } = this.props.search;

        if (error) {
            return <div className="search-status search-error">{ error }</div>;
        }
        if (isReplacing) {
            return <div className="search-status">Replacing...</div>;
        }
        if (isSearching) {
            return <div className="search-status">Searching...</div>;
        }
        if (notice) {
            return <div className="search-status search-notice">{ notice }</div>;
        }
        if (!hasSearched || !query) {
            return <div className="search-status">Type the text to search for and press Enter.</div>;
        }
        if (totalMatches === 0) {
            return <div className="search-status">No results found.</div>;
        }
        return (
            <div className="search-status">
                { `${plural(totalMatches, 'result')} in ${plural(totalFiles, 'file')}` }
                { truncated && ' - only the first results are shown, please make the search more specific' }
                {
                    skippedFiles > 0 &&
                    <span className="search-skipped" title="Binary files, files that are too big and files that are not UTF-8 encoded are not searched">
                        { ` (${plural(skippedFiles, 'file')} skipped)` }
                    </span>
                }
            </div>
        );
    }

    renderScope() {
        const { search, rootPath, rootName } = this.props;
        const { folder } = search;
        if (!folder) {
            return null;
        }
        let label = rootName || folder;
        if (rootPath && folder !== rootPath && folder.startsWith(rootPath)) {
            label = `${rootName || ''}${folder.slice(rootPath.length)}`;
        }
        const isSubFolder = !!rootPath && folder !== rootPath;
        return (
            <span className="search-scope" title={ folder }>
                <span className="search-scope-label">in</span>
                <span className="search-scope-folder">{ label }</span>
                {
                    isSubFolder &&
                    <Tooltip title="Search in the whole project">
                        <UndoOutlined className="search-action" onClick={ this.handleResetFolder } />
                    </Tooltip>
                }
            </span>
        );
    }

    render() {
        const { search, hideSearch, runSearch, setSearchOptions, dismissSearchFile } = this.props;
        if (!search.visible) {
            return null;
        }
        const { panelHeight, collapsed } = this.state;
        const {
            showReplace,
            query,
            replacement,
            include,
            exclude,
            results,
            isSearching,
            isReplacing
        } = search;
        const canReplace = showReplace && !isReplacing && !isSearching;

        return (
            <div
                className="ide-search"
                ref={ (el) => { this.rootElement = el; } }
                style={ { height: panelHeight, minHeight: panelHeight } }
                onKeyDown={ this.handleKeyDown }
            >
                <button type="button" className="dragline" onMouseDown={ this.handleMouseDown } />
                <div className="panel-header search-header">
                    <span className="search-title">Find in Files</span>
                    { this.renderScope() }
                    <CloseOutlined className="logClose" onClick={ hideSearch } />
                </div>
                <div className="search-form">
                    <div className="find-row">
                        <Tooltip title={ showReplace ? 'Hide Replace' : 'Show Replace' }>
                            <span
                                className="search-expander"
                                onClick={ () => setSearchOptions({ showReplace: !showReplace }) }
                            >
                                { showReplace ? <DownOutlined /> : <RightOutlined /> }
                            </span>
                        </Tooltip>
                        <Input
                            ref={ this.queryRef }
                            size="small"
                            placeholder="Find"
                            value={ query }
                            onChange={ (e) => setSearchOptions({ query: e.target.value }) }
                            onPressEnter={ runSearch }
                            suffix={
                                <span className="search-toggles">
                                    { this.renderToggle('matchCase', 'Aa', 'Match Case') }
                                    { this.renderToggle('wholeWord', 'ab', 'Match Whole Word') }
                                    { this.renderToggle('useRegex', '.*', 'Use Regular Expression') }
                                </span>
                            }
                        />
                        <Button size="small" type="primary" loading={ isSearching } onClick={ runSearch }>Search</Button>
                    </div>
                    {
                        showReplace &&
                        <div className="find-row">
                            <span className="search-expander" />
                            <Input
                                size="small"
                                placeholder="Replace"
                                value={ replacement }
                                onChange={ (e) => setSearchOptions({ replacement: e.target.value }) }
                            />
                            <Button size="small" disabled={ !canReplace || results.length === 0 } onClick={ this.handleReplaceAll }>
                                Replace All
                            </Button>
                        </div>
                    }
                    <div className="find-row">
                        <span className="search-expander" />
                        <Input
                            size="small"
                            placeholder="Files to include (e.g. *.js, src/**)"
                            value={ include }
                            onChange={ (e) => setSearchOptions({ include: e.target.value }) }
                            onPressEnter={ runSearch }
                        />
                        <Input
                            size="small"
                            placeholder="Files to exclude (e.g. *.min.js, dist)"
                            value={ exclude }
                            onChange={ (e) => setSearchOptions({ exclude: e.target.value }) }
                            onPressEnter={ runSearch }
                        />
                    </div>
                </div>
                { this.renderStatus() }
                <SearchResults
                    results={ results }
                    collapsed={ collapsed }
                    canReplace={ canReplace }
                    onToggle={ this.handleToggle }
                    onOpenMatch={ this.handleOpenMatch }
                    onReplaceFile={ this.handleReplaceFile }
                    onDismissFile={ dismissSearchFile }
                />
            </div>
        );
    }
}
