/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React, { PureComponent, Fragment } from 'react';
import Panel from '../../components/Panel';
import ScrollContainer from '../../components/ScrollContainer';
import PropertyList, { PropertyItem } from '../../components/PropertyList';

type Props = {
  runtimeSettings: null | object,
};

const DEFAULT_EDITOR_LANGUAGE = 'javascript';

export default class Settings extends PureComponent<Props> {
  props: Props;

  render() {
      return (
        <Panel header="Settings">
            <ScrollContainer
                refreshScroll={this.props.refreshScroll}
                disableHorizontal
                classes="tree-wrapper scroller"
            >
                {() => (
                    <PropertyList>
                        <PropertyItem key="iterations" label="Iterations" value="0" type="number" editable />
                        <PropertyItem key="params-file" label="Parameter File" value="" type="string" editable />
                    </PropertyList>
                )}
            </ScrollContainer>
        </Panel>
      );    
  }
}
