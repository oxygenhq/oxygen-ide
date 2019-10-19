/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow

import View from './View.js';
import styled from '@emotion/styled';

type Props = {
  /** Flexbox's shrink property. Set to `0`, to disable shrinking. */
  shrink?: number,
};

/**
 * A container using flexbox to layout its children
 */
export default styled(View)(({shrink}: Props) => ({
    display: 'flex',
    flexShrink: shrink == null || shrink ? 1 : 0,
}));
