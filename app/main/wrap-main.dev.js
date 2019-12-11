require('@babel/register')({
    extends: './babel.config.js',
    ignore: [/node_modules/, /app\/node_modules/],
});


require('./main.dev.js'); 