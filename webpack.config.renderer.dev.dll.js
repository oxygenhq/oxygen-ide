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

export default merge(baseConfig, {
    mode: 'development',

    context: process.cwd(),

    devtool: 'eval',

    target: 'electron-renderer',

    // without this, webpack5 infers externalsType from output.libraryTarget ('var' below),
    // emitting `module.exports = somePackage;` (raw global ref) instead of a require() call
    externalsType: 'commonjs2',
    externals: ['fsevents', 'crypto-browserify', /^@sentry\//, 'winston', /^winston-/, 'appium-adb', /^appium-/],

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
                exclude: [/node_modules[\\/](?!node-gyp)/, /app\/node_modules/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        plugins: [
                            ['@babel/plugin-proposal-class-properties', { 'loose': true }],
                            ['@babel/plugin-proposal-private-methods', { 'loose': true }],
                            ['@babel/plugin-proposal-private-property-in-object', { 'loose': true }],
                            '@babel/plugin-transform-classes',
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
                type: 'asset/resource',
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
                type: 'asset',
                parser: { dataUrlCondition: { maxSize: 10000 } },
            },
            // WOFF2 Font
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
                parser: { dataUrlCondition: { maxSize: 10000 } },
            },
            // TTF Font
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
                parser: { dataUrlCondition: { maxSize: 10000 } },
            },
            // EOT Font
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset/resource',
            },
            // SVG Font
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                type: 'asset',
                parser: { dataUrlCondition: { maxSize: 10000 } },
            },
            // Common Image Formats
            {
                test: /\.(?:ico|gif|png|jpg|jpeg|webp)$/,
                type: 'asset/inline',
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
          && dependency !== 'mixpanel'
          && dependency !== 'fs-extra'
          && dependency !== 'browserstack-local'
          && dependency !== 'teen_process'
                )
        )
    },

    output: {
        library: 'renderer',
        path: dist,
        publicPath: publicPath,
        filename: '[name].dev.dll.js',
        libraryTarget: 'var',
        hashFunction: 'sha256'
    },

    plugins: [
        new webpack.DllPlugin({
            path: path.join(dist, '[name].json'),
            name: '[name]',
        }),

        // node-gyp's Find-VisualStudio.cs is a PowerShell/C# helper invoked out-of-process,
        // never require()'d — webpack 5 fails parsing it as JS via node-gyp's require.context
        new webpack.IgnorePlugin({ resourceRegExp: /\.cs$/, contextRegExp: /node-gyp/ }),

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
