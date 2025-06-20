/**
 * Builds the DLL for development electron renderer process
 */

import webpack from 'webpack';
import path from 'path';
import merge from 'webpack-merge';
import baseConfig from './webpack.config.base';
import { dependencies } from './package.json';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

CheckNodeEnv('development');

const dist = path.resolve(process.cwd(), 'dll');
const publicPath = dist+'/';

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
                test: /\.js$/,
                // include: /node_modules\/node-gyp/, // Target problematic module
                include: (filepath) => filepath.includes('make-fetch-happen'),
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',      // Handles class properties
                            '@babel/plugin-proposal-private-methods',       // Handles private methods
                            '@babel/plugin-proposal-private-property-in-object' // Handles private properties
                        ]
                    }
                }
            },
            {
                test: /\.(js|jsx)?$/,
                exclude: [/node_modules\/(?!node-gyp)/, /app\/node_modules/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        plugins: [
                            // Here, we include babel plugins that are only required for the
                            // renderer process. The 'transform-*' plugins must be included
                            // before react-hot-loader/babel
                            ['@babel/plugin-proposal-class-properties', { 'loose': true }],
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

            // monaco editor css & ttf
            {
                test: /node_modules[/\\]*monaco-editor[/\\]*esm.*\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /node_modules[/\\]*monaco-editor[/\\]*esm.*\.ttf$/,
                use: ['file-loader']
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
        publicPath: publicPath,
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
                     
        new MonacoWebpackPlugin({
            languages: ['javascript', 'typescript', 'json', 'xml'],
            features: [
            'accessibilityHelp', 'bracketMatching', 'caretOperations', 'clipboard', 'codeAction', 'comment',
            'contextmenu', 'coreCommands', 'cursorUndo', 'find', 'folding', 'fontZoom', 'format',
            'gotoError', 'gotoLine', 'gotoSymbol', 'hover', 'inPlaceReplace', 'linesOperations', 'links',
            'multicursor', 'parameterHints', 'quickCommand', 'quickOutline', 'referenceSearch', 'rename',
            'smartSelect', 'snippets', 'suggest', 'toggleHighContrast', 'toggleTabFocusMode', 'transpose',
            'wordHighlighter', 'wordOperations', 'wordPartOperations']
        }),
    ],
});
