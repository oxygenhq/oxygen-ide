/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow
import React from 'react';
import Panel from '../../components/Panel.jsx';
import ScrollContainer from '../../components/ScrollContainer.jsx';
import PropertyList, { PropertyItem } from '../../components/PropertyList/index.jsx';

type Props = {
  runtimeSettings: null | object,
  refreshScroll: Function
};

export default class Settings extends React.PureComponent<Props> {
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
                          <PropertyItem base="iterations" label="Iterations" value="0" type="number" editable />
                          <PropertyItem base="params-file" label="Parameter File" value="" type="string" editable />
                      </PropertyList>
                  )}
              </ScrollContainer>
          </Panel>
      );    
  }
}
