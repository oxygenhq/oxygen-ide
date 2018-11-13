/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React, { PureComponent, Fragment } from 'react';
import type { Element } from 'react';
import '../../css/property-list.scss';

type Props = {
    children?: Element,
    onChange: (key: string, value: any) => void,
};

export default class PropertyList extends PureComponent<Props> {    
    render() {
        const { children } = this.props;

        return (
            <div className="property-list">
                { children }
            </div>
        );
    }
}

export class PropertyItem extends PureComponent
    <{|
        key: string,
        label: string, 
        type: 'boolean' | 'string' | 'number' | 'list',
        value?: any,
        list?: Array<any>,
        defaultValue?: any,
        editable?: boolean,
        onChange?: (key: string, value: any) => void,
    |}> {

    render() {
        const { key, label, value, editable = false } = this.props;

        return (
            <div className="property-item">
                <div className="label">{ label }</div>
                <div className="value">
                    { renderPropertyValue(this.props) }
                </div>
            </div>
        );
    }
}

function renderPropertyValue(props) {
    const { type, editable = false } = props;
    if (type === 'number' && editable) {
        return (
            <EditableNumber { ...props } />
        )
    }
    else {
        return (
            <FormattedValue { ...props } />
        )
    }
}

class FormattedValue extends PureComponent {
    render() {
        const { value } = this.props;
        return (
            <span>{ value }</span>
        );        
    }
}

class EditableNumber extends PureComponent {
    render() {
        const { value } = this.props;

        return (
            <input className="editable-number" value={ value } type="number" />
        );
    }
}
