/*
 * Copyright (C) 2015-2018 CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
import PerfectScrollbar from 'perfect-scrollbar';

/* eslint-disable import/prefer-default-export */
export const initializeScroll = (
  container,
  disableHorizontal = false,
  disableVertical = false,
) => {
  if (!container) {
    return false;
  }

  const config = {
    wheelSpeed: 0.8,
    wheelPropagation: true,
    minScrollbarLength: 20,
  };

  if (disableHorizontal) {
    config.suppressScrollX = true;
  }

  if (disableVertical) {
    config.suppressScrollY = true;
  }

  return new PerfectScrollbar(container, config);
};
