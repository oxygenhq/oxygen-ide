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

/**
 * A container dispalying its children horizontally and vertically centered.
 */
export default styled(View)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
