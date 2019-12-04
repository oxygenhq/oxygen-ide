/**
 * Builds the DLL for development electron renderer process
 */

import webpack from 'webpack';
import path from 'path';
import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';
import { dependencies } from './package.json';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';

CheckNodeEnv('development');

const dist = path.resolve(process.cwd(), 'dll');

export default merge.smart(baseConfig, {
    mode: 'development',

    context: process.cwd(),

    devtool: 'eval',

    target: 'electron-renderer',

    externals: ['fsevents', 'crypto-browserify'],

    /**
   * Use `module` from `webpack.config.renderer.dev.js`
   */
    module: {
        rules: [
            {
                test: /\.(js|jsx)?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        plugins: [
                            // Here, we include babel plugins that are only required for the
                            // renderer process. The 'transform-*' plugins must be included
                            // before react-hot-loader/babel
                            ['@babel/plugin-proposal-class-properties', { 'loose': true }],
                            '@babel/plugin-syntax-class-properties',
                            'transform-class-properties',
                            '@babel/plugin-transform-classes',
                            'react-hot-loader/babel'
                        ],
                    }
                }
            },


            // @STYLES starts
            {
                // doesn't contains module keyword
                // also is using for global and imports
                test: /^((?!\.module).)*\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    }
                ]
            },
            {
                // contains module keyword
                test: /\.module\.css$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                ]
            },

            // doesn't contains module keyword
            // also is using for global and imports
            {
                test: /^((?!\.module).)*\.(scss|sass)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            sourceMap: true,
                        },
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },

            // contains module keyword
            {
                test: /\.module\.(scss|sass)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'style-loader'
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                            localIdentName: '[name]__[local]__[hash:base64:5]',
                        }
                    },
                    {
                        loader: 'sass-loader'
                    }
                ]
            },
            // @STYLES ends


            // WOFF Font
            {
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/font-woff',
                    }
                },
            },
            // WOFF2 Font
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/font-woff',
                    }
                }
            },
            // TTF Font
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'application/octet-stream'
                    }
                }
            },
            // EOT Font
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                use: 'file-loader',
            },
            // SVG Font
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: {
                    loader: 'url-loader',
                    options: {
                        limit: 10000,
                        mimetype: 'image/svg+xml',
                    }
                }
            },
            // Common Image Formats
            {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                use: 'url-loader',
            }
        ]
    },

    entry: {
        renderer: (
            Object
                .keys(dependencies || {})
                .filter(
                    dependency => dependency !== 'font-awesome'
          && dependency !== 'firacode'
          && dependency !== 'react-icons'
          && dependency !== 'adbkit'
          && dependency !== 'antd'
                )
        )
    },

    output: {
        library: 'renderer',
        path: dist,
        filename: '[name].dev.dll.js',
        libraryTarget: 'var'
    },

    plugins: [
        new webpack.DllPlugin({
            path: path.join(dist, '[name].json'),
            name: '[name]',
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
            NODE_ENV: 'development'
        }),

        new webpack.LoaderOptionsPlugin({
            debug: true,
            options: {
                context: path.resolve(process.cwd(), 'app'),
                output: {
                    path: path.resolve(process.cwd(), 'dll'),
                },
            },
        }),
    ],
});
