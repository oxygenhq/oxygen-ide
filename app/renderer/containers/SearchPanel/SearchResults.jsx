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
import { CloseOutlined, DownOutlined, RightOutlined, SwapOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

type Match = {
    line: number,
    column: number,
    length: number,
    preview: string,
    previewOffset: number
};

type FileResult = {
    path: string,
    relativePath: string,
    matches: Array<Match>
};

type Props = {
    results: Array<FileResult>,
    collapsed: { [path: string]: boolean },
    canReplace: boolean,
    onToggle: (path: string) => void,
    onOpenMatch: (path: string, match: Match) => void,
    onReplaceFile: (path: string) => void,
    onDismissFile: (path: string) => void
};

// the matched part of the line is highlighted
const MatchPreview = ({ match }: { match: Match }) => {
    const { preview, previewOffset, length } = match;
    return (
        <span className="search-match-text">
            { preview.slice(0, previewOffset) }
            <mark>{ preview.substr(previewOffset, length) }</mark>
            { preview.slice(previewOffset + length) }
        </span>
    );
};

const SearchResults = ({ results, collapsed, canReplace, onToggle, onOpenMatch, onReplaceFile, onDismissFile }: Props) => (
    <div className="search-results">
        {
            results.map((file) => {
                const isCollapsed = !!collapsed[file.path];
                const fileName = file.relativePath.split('/').pop();
                const folder = file.relativePath.slice(0, file.relativePath.length - fileName.length);
                return (
                    <div className="search-file" key={ file.path }>
                        <div className="search-file-header" title={ file.path } onClick={ () => onToggle(file.path) }>
                            { isCollapsed ? <RightOutlined className="search-chevron" /> : <DownOutlined className="search-chevron" /> }
                            <span className="search-file-name">{ fileName }</span>
                            <span className="search-file-folder">{ folder }</span>
                            <span className="search-count">{ file.matches.length }</span>
                            <span className="search-file-actions" onClick={ (e) => e.stopPropagation() }>
                                {
                                    canReplace &&
                                    <Tooltip title="Replace in this file">
                                        <SwapOutlined className="search-action" onClick={ () => onReplaceFile(file.path) } />
                                    </Tooltip>
                                }
                                <Tooltip title="Dismiss">
                                    <CloseOutlined className="search-action" onClick={ () => onDismissFile(file.path) } />
                                </Tooltip>
                            </span>
                        </div>
                        {
                            !isCollapsed && file.matches.map((match) => (
                                <div
                                    className="search-match"
                                    key={ `${match.line}:${match.column}` }
                                    onClick={ () => onOpenMatch(file.path, match) }
                                >
                                    <span className="search-match-line">{ match.line }</span>
                                    <MatchPreview match={ match } />
                                </div>
                            ))
                        }
                    </div>
                );
            })
        }
    </div>
);

// the list can have thousands of rows, so it is only rendered again when its own props change (not while the user types)
export default React.memo(SearchResults);
