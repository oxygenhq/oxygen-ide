/**
 * Build config for electron renderer process
 */

import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';

CheckNodeEnv('production');

export default merge.smart(baseConfig, {
    devtool: 'source-map',

    target: 'electron-renderer',

    entry: ['core-js/stable', 'regenerator-runtime/runtime', './app/renderer/index'],

    output: {
        path: path.join(__dirname, 'app/dist'),
        publicPath: '',
        filename: 'renderer.prod.js'
    },

    module: {
        rules: [
            // Extract all .global.css to style.css as is
            {
                test: /\.global\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ]
            },
            // Pipe other styles through css modules and append to style.css
            {
                test: /^((?!\.global).)*\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                ]
            },
            // Add SASS support  - compile all .global.scss files and pipe it to style.css
            {
                test: /\.global\.(scss|sass)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: { importLoaders: 1 },
                    },
                    'postcss-loader',
                    'sass-loader'
                ]
            },
            // Add SASS support  - compile all other .scss files and pipe it to style.css
            {
                test: /^((?!\.global).)*\.(scss|sass)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: { importLoaders: 1 },
                    },
                    'sass-loader'
                ]
            },
            // Fonts
            {
                test: /\.(woff|woff2|eot|ttf|otf|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'file-loader'
                }
            },
            // Common Image Formats
            {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                use: 'url-loader',
            }
        ]
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
            }),
            new OptimizeCSSAssetsPlugin({})
        ]
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.type': '"renderer"'
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
            NODE_ENV: 'production'
        }),

        new MiniCssExtractPlugin({
            filename: 'style.css'
        }),

        new BundleAnalyzerPlugin({
            analyzerMode: process.env.OPEN_ANALYZER === 'true' ? 'server' : 'disabled',
            openAnalyzer: process.env.OPEN_ANALYZER === 'true'
        }),

        // ignore locale files of moment.js
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/)
    ],
});
