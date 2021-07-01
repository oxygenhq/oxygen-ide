/*
 * Copyright (C) 2015-present CloudBeat Limited
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */

import { util as oxutil } from 'oxygen-cli';
import ServiceBase from './ServiceBase';

const CRYPTO_SHOW_DIALOG = 'CRYPTO_SHOW_DIALOG';

export default class CryptoService extends ServiceBase {
    constructor() {
        super();
    }

    start() {
        this.notify({
            type: CRYPTO_SHOW_DIALOG
        });
    }

    decrypt(text) {
        try {
            const decryptResult = oxutil.decrypt(text);

            if (decryptResult && decryptResult.getDecryptResult) {
                const result = decryptResult.getDecryptResult();
                
                this.notify({
                    type: CRYPTO_SHOW_DIALOG,
                    result: result,
                    error: null
                });
            } else {
                this.notify({
                    type: CRYPTO_SHOW_DIALOG,
                    result: null,
                    error: 'Failed to decrypt'
                });
            }
        } catch (e) {
            this.notify({
                type: CRYPTO_SHOW_DIALOG,
                result: null,
                error: 'Failed to decrypt'
            });
        }
    }

    encrypt(text) {
        try {
            const encryptResult = oxutil.encrypt(text);

            this.notify({
                type: CRYPTO_SHOW_DIALOG,
                result: encryptResult,
                error: null
            });

        } catch (e) {
            this.notify({
                type: CRYPTO_SHOW_DIALOG,
                result: null,
                error: 'Failed to encrypt'
            });
        }
    }
}