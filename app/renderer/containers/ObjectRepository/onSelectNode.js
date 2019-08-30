/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
/*
 * This method is called when user selects node in the File Tree. 
 * The method checks if file or folder is already open and either opens a new file or folder, or make the existing tab active.
 */ 
export default function (selectedKeys, info) {
  const { nodeInfo } = info.node.props;

  this.props.setActive(nodeInfo.path);
  if (this.props.onSelect) {
    this.props.onSelect(nodeInfo);
  }
}
