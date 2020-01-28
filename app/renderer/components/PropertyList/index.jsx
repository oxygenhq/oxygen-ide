/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import React from 'react';
import type { Element } from 'react';
import '../../css/property-list.scss';

type Props = {
    children?: Element
};

export default class PropertyList extends React.PureComponent<Props> {    
    render() {
        const { children } = this.props;

        return (
            <div className="property-list">
                { children }
            </div>
        );
    }
}

export class PropertyItem extends React.PureComponent
    <{|
        base: string,
        label: string, 
        type: 'boolean' | 'string' | 'number' | 'list',
        value?: any,
        list?: Array<any>,
        defaultValue?: any,
        editable?: boolean
    |}> {

    render() {
        const { label } = this.props;

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
        );
    }
    else {
        return (
            <FormattedValue { ...props } />
        );
    }
}

type FormattedValueProps = {
    value: any
};

class FormattedValue extends React.PureComponent<FormattedValueProps> {
    render() {
        const { value } = this.props;
        return (
            <span>{ value }</span>
        );        
    }
}

type EditableNumberProps = {
    value: number
};

class EditableNumber extends React.PureComponent<EditableNumberProps> {
    render() {
        const { value } = this.props;

        return (
            <input className="editable-number" value={ value } type="number" onChange={()=>{}} />
        );
    }
}
