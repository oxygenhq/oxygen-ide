module.exports = {
  'presets': [
    ['@babel/preset-env',{
      'targets': {
        'node': '8.10'
      },
      // Allow importing core-js in entrypoint and use browserlist to select polyfills
      'useBuiltIns': 'entry',
      // Set the corejs version we are using to avoid warnings in console
      // This will need to change once we upgrade to corejs@3
      'corejs': 3,
      // Transform modules based on env support
      'modules': 'auto',
      // Exclude transforms that make all code slower
      'exclude': ['transform-typeof-symbol']
    }],
    ['@babel/preset-flow'],
    '@babel/preset-react'
  ],
  'plugins': [
    '@babel/transform-modules-commonjs',
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-syntax-import-meta',
    ['@babel/plugin-proposal-class-properties', { 'loose': true }],
    '@babel/plugin-syntax-class-properties',
    '@babel/plugin-proposal-function-bind',
    ['@babel/plugin-transform-runtime',
      {
        'regenerator': true
      }
    ],
    ['import', { 'libraryName': 'antd', 'libraryDirectory': 'es', 'style': 'css' }],
    'add-module-exports',
    [
      '@babel/plugin-proposal-decorators',
      {
          'decoratorsBeforeExport': true
      }
    ]
  ],
  'env': {
    'electron': {
      'presets': [
        ['@babel/preset-env',{
            'targets': {
              'node': '8.10'
            },
            // Allow importing core-js in entrypoint and use browserlist to select polyfills
            'useBuiltIns': 'entry',
            // Set the corejs version we are using to avoid warnings in console
            // This will need to change once we upgrade to corejs@3
            'corejs': 3,
            // Transform modules based on env support
            'modules': 'auto',
            // Exclude transforms that make all code slower
            'exclude': ['transform-typeof-symbol']
        }],
        ['@babel/preset-flow'],
        '@babel/preset-react'
      ],
      'plugins': [
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-syntax-import-meta',
        ['@babel/plugin-proposal-class-properties', { 'loose': true }],
        '@babel/plugin-syntax-class-properties',
        '@babel/plugin-proposal-json-strings',
        '@babel/plugin-proposal-function-bind',
        ['import', { 'libraryName': 'antd', 'libraryDirectory': 'es', 'style': 'css' }],
        'add-module-exports',
        [
          '@babel/plugin-proposal-decorators',
          {
              'decoratorsBeforeExport': true
          }
        ]
      ]
    },
    'production': {
      'plugins': ['dev-expression']
    },
    'development': {
      'plugins': [
        ['@babel/plugin-proposal-class-properties', { 'loose': true }],
        '@babel/plugin-syntax-class-properties',
        'transform-class-properties',
        '@babel/plugin-transform-classes',
        ['flow-runtime', {
          'assert': true,
          'annotate': true
        }]
      ]
    },
    'test': {
      'plugins': [
        ['@babel/plugin-proposal-class-properties', { 'loose': true }],
        '@babel/plugin-syntax-class-properties',
        'transform-class-properties',
        '@babel/plugin-transform-classes',
      ],
      'presets': ['react']
    }
  },
  'ignore': [/app\/node_modules/],
  'overrides': [{
    'test': /underscore.js/,
    'sourceType': 'script',
  }],
};