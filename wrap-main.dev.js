require('@babel/register')({
    'extends': './.babelrc',
    'ignore': ['node_modules', 'app/node_modules']
    // 'presets': ['./node_modules/@babel/preset-env'], 'retainLines': true
});

require('./app/main/main.dev.js'); 