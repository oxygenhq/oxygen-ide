// console.log(JSON.stringify(require(process.argv[2])));

var fs = require('fs');

function requireFromString(src, filename) {
    try {
        var Module = module.constructor;
        var m = new Module();
        m._compile(src, filename);
        return m.exports;
    } catch(e){
        console.log('orgRequire e', e);
    }
}

function orgRequire(path){
    try {
        var text = fs.readFileSync(path,'utf8');
        return requireFromString(text, path);
    } catch(e){
        console.log('orgRequire e', e);
    }
}

var result = orgRequire(process.argv[2]);
console.log(JSON.stringify(result));