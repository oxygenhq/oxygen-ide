/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import { DragSource, DropTarget } from 'react-dnd';
import { cardSource, cardTarget } from '../../components/dndHelper';

type Props = {
    connectDragSource: Function,
    connectDropTarget: Function,
    isDragging: boolean,
    children: Array<React.Node> | React.Node
};

class DraggableTab extends React.Component<Props> {
    render() {
        const {
            connectDragSource, connectDropTarget, isDragging,
        } = this.props;
        const style = {
            //      borderBottom: '1px solid #d9d9d9',
            opacity: isDragging ? 0.1 : 1,
            cursor: 'move',
        };

        return connectDragSource(connectDropTarget(
            <div style={style}>
                {this.props.children}
            </div>,
        ));
    }
}

// export default DraggableTab;

export default DropTarget(
    'menuitem',
    cardTarget,
    connect => ({
        connectDropTarget: connect.dropTarget(),
    }))(
    DragSource(
        'menuitem',
        cardSource,
        (connect, monitor) => ({
            connectDragSource: connect.dragSource(),
            isDragging: monitor.isDragging()
        }))(
        DraggableTab
    )
);

