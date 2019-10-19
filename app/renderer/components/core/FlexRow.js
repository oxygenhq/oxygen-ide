/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
// @flow

import FlexBox from './FlexBox.js';
import styled from '@emotion/styled';

/**
 * A container dispalying its children in a row
 */
export default styled(FlexBox)({
    flexDirection: 'row',
});
