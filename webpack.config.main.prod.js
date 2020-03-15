/**
 * Webpack config for production electron main process
 */

import webpack from 'webpack';
import merge from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import baseConfig from './webpack.config.base';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';

CheckNodeEnv('production');

export default merge.smart(baseConfig, {
    devtool: 'source-map',

    target: 'electron-main',

    entry: ['core-js/stable', 'regenerator-runtime/runtime',  './app/main/main.dev'],

    output: {
        path: __dirname,
        filename: './app/main/main.prod.js'
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                sourceMap: true,
                terserOptions: {
                    ecma: 2016
                }
            })
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.type': '"browser"'
        }),

        new BundleAnalyzerPlugin({
            analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
            openAnalyzer: process.env.OPEN_ANALYZER === 'true'
        }),

        /**
         * Create global constants which can be configured at compile time.
         *
         * Useful for allowing different behaviour between development builds and
         * release builds
         *
         * NODE_ENV should be production so that modules do not perform certain
         * development checks
         */
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
            DEBUG_PROD: 'false',
            RELEASE_BUILD: process.env.RELEASE_BUILD || false
        }),

        // adbkit has a double require for CoffeScript and Javascript and packing fails if we don't ingore the CS ones.
        new webpack.IgnorePlugin(/(\.\/src\/adb)|(\.\/src\/monkey)|(\.\/src\/logcat)/),

        // ignore locale files of moment.js
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
});
