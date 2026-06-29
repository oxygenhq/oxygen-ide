/* eslint global-require: 0, import/no-dynamic-require: 0 */

/**
 * Build config for development electron renderer process that uses
 * Hot-Module-Replacement
 *
 * https://webpack.js.org/concepts/hot-module-replacement/
 */

import path from 'path';
import fs from 'fs';
import webpack from 'webpack';
import chalk from 'chalk';
import merge from 'webpack-merge';
import { spawn, execSync } from 'child_process';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import baseConfig from './webpack.config.base';
import CheckNodeEnv from './internals/scripts/CheckNodeEnv';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

CheckNodeEnv('development');

const port = process.env.PORT || 1212;
const publicPath = `http://localhost:${port}/dist`;
const dll = path.resolve(process.cwd(), 'dll');
const manifest = path.resolve(dll, 'renderer.json');

/**
 * Warn if the DLL is not built
 */
if (!(fs.existsSync(dll) && fs.existsSync(manifest))) {
    console.log(chalk.black.bgYellow.bold('The DLL files are missing. Sit back while we build them for you with "npm run build-dll"'));
    execSync('npm run build-dll');
}

export default merge(baseConfig, {
    mode: 'development',

    // sentry v7 uses ESM internally — exclude from bundle, load via require() at runtime
    externals: [
        /^@sentry\//,
    ],

    devtool: 'inline-source-map',

    target: 'electron-renderer',

    entry: [
        // devServer.hot: true (below) auto-injects the HMR client + runtime — don't add it manually here
        path.join(__dirname, 'app/renderer/index.js'),
    ],

    output: {
        publicPath: `http://localhost:${port}/dist/`,
        filename: 'renderer.dev.js',
        hashFunction: 'sha256'
    },

    module: {
        rules: [
            {
                test: /\.(js|jsx)?$/,
                exclude: [/node_modules/, /app\/node_modules/],
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [
                            ['@babel/preset-env',{
                                // Allow importing core-js in entrypoint and use browserlist to select polyfills
                                'useBuiltIns': 'entry',
                                // Set the corejs version we are using to avoid warnings in console
                                // This will need to change once we upgrade to corejs@3
                                'corejs': 3,
                                // Transform modules based on env support
                                'modules': 'cjs',
                                // Exclude transforms that make all code slower
                                'exclude': ['transform-typeof-symbol']
                            }],
                            '@babel/preset-react',
                            '@babel/preset-flow',
                        ],
                        plugins: [
                            // Here, we include babel plugins that are only required for the
                            // renderer process. The 'transform-*' plugins must be included
                            // before react-refresh/babel
                            '@babel/transform-modules-commonjs',
                            ['@babel/plugin-proposal-class-properties', { 'loose': true }],
                            '@babel/plugin-transform-classes',
                            'react-refresh/babel',
                            '@babel/plugin-proposal-function-bind',
                            ['import', { 'libraryName': 'antd', 'libraryDirectory': 'es', 'style': false }],
                            'add-module-exports',
                            [
                              '@babel/plugin-proposal-decorators',
                              {
                                  'decoratorsBeforeExport': true
                              }
                            ],
                            ['transform-imports'],
                            '@babel/plugin-transform-runtime'
                        ],
                    }
                }
            },

            // @TODO: update prod build
            // @STYLES starts
            {
                // prev - test: /\.global\.css$/,
                // doesn't contains module keyword
                // also is using for global and imports
                test: /^((?!\.module).)*\.css$/,
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
                // prev - test: /^((?!\.global).)*\.css$/,
                // contains module keyword
                test: /\.module\.css$/,
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
                type: 'asset/inline',
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

    plugins: [
        new webpack.DllReferencePlugin({
            context: process.cwd(),
            manifest: require(manifest),
            sourceType: 'var',
        }),

        /**
     * Create global constants which can be configured at compile time.
     *
     * Useful for allowing different behaviour between development builds and
     * release builds
     *
     * NODE_ENV should be production so that modules do not perform certain
     * development checks
     *
     * By default, use 'development' as NODE_ENV. This can be overriden with
     * 'staging', for example, by changing the ENV variables in the npm scripts
     */
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'development'
        }),

        new webpack.LoaderOptionsPlugin({
            debug: true
        }),

        // editor.api.js (imported directly by MonacoEditor/index.jsx) gets bundled fresh here,
        // not via the DLL (only bare package names get auto-swept into the DLL) — without this,
        // the basic-languages tokenizer contributions (javascript, typescript, etc.) never get
        // wired into the monaco instance the app actually uses, breaking syntax highlighting.
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

        new ReactRefreshWebpackPlugin(),
    ],

    node: {
        __dirname: false,
        __filename: false
    },

    devServer: {
        port,
        client: {
            webSocketURL: {
                hostname: 'localhost',
                pathname: '/ws',
                port: 1212
            },
            overlay: {
                runtimeErrors: (error) =>
                    error?.message !== 'ResizeObserver loop completed with undelivered notifications.',
            },
        },
        compress: true,
        devMiddleware: {
            publicPath: publicPath,
            stats: 'errors-only',
        },
        hot: true,
        headers: { 'Access-Control-Allow-Origin': '*' },
        static: {
            directory: path.join(__dirname, 'dist'),
            watch: {
                aggregateTimeout: 300,
                usePolling: false,
                ignored: /node_modules/,
                poll: 100
            }
        },
        historyApiFallback: {
            verbose: true,
            disableDotRule: false,
        },
        setupMiddlewares: (middlewares, devServer) => {
            if (process.env.START_HOT) {
                console.log('\x1b[32m%s\x1b[0m', 'Starting Main Process...');
                spawn(
                    'npm',
                    ['run', 'start-main-dev'],
                    { shell: true, env: process.env, stdio: 'inherit' }
                )
                    .on('close', code => process.exit(code))
                    .on('error', spawnError => console.error(spawnError));
            }
            return middlewares;
        }
    },
});
