/**
 * Webpack config for production electron main process
 */

import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import TerserPlugin from 'terser-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import baseConfig from './webpack.config.base';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';
import { sentryWebpackPlugin } from '@sentry/webpack-plugin';
import getSentryConfig from './internals/scripts/getSentryConfig';
import { version }  from './package.json';

CheckNodeEnv('production');

export default merge(baseConfig, {
    devtool: 'source-map',

    target: 'electron-main',

    entry: ['core-js/stable', 'regenerator-runtime/runtime',  './app/main/main.dev.js'],

    output: {
        path: path.join(__dirname, 'app/main'),
        publicPath: process.env.RELEASE_BUILD ? '../main/' /*npm run package*/ : '../app/main/' /*npm run start*/,
        filename: 'main.prod.js',
        hashFunction: 'sha256'
    },
    externals: [
        // sentry v7 uses ESM internally — exclude from webpack bundle, load via require() at runtime
        /^@sentry\//,
        // mixpanel's bundled feature-flags code uses syntax webpack 4 / Terser can't parse — exclude and load via require() at runtime
        'mixpanel',
        // appium-adb pulls in sharp's native .node binaries via @appium/support — can't be bundled, must load via require() at runtime
        'appium-adb',
    ],

    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
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
        new webpack.IgnorePlugin({ resourceRegExp: /(\.\/src\/adb)|(\.\/src\/monkey)|(\.\/src\/logcat)/ }),

        // ignore locale files of moment.js
        new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }),
        
        sentryWebpackPlugin({
            ...getSentryConfig(),
            release: { name: version },
            sourcemaps: {
                assets: [
                    'app/main/main.prod.js.map',
                    'app/main/main.prod.js',
                ],
                ignore: ['node_modules', 'webpack.config.js'],
            },
        }),
    ],
});
