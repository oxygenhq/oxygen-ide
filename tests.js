var fs = require('fs');
var path = require('path');
var util = require('util');


var pathToFile = 'C:\projects\testFolder\valid.js';

var pathToFile3 = "C:/projects/testFolder/valid.js";

var pathToFile2 = "C:\\projects\\testFolder\\valid.js";

console.log('1 q', util.inspect(pathToFile));
console.log('1 qs', pathToFile.toString(pathToFile));

var q = util.inspect(pathToFile.split(':').join(':\\'));
console.log('q', q);

var u = q;


console.log('util.inspect(', u);

var split = u.split(path.sep);

console.log('util split', split);

console.log('util join', split.join('\\\\'));



var splitf = split.filter(item => !!item);


console.log('util split f', splitf);

var zz = splitf.join('\\');
console.log('util join f', zz);

var zzz = zz.substr(1);

var zzz = zzz.slice(0, -1);

console.log('zzz', zzz );

// var zzz = util.inspect(zzz);

// console.log('zzz 2', zzz );

console.log('pathToFile2', pathToFile2 );

console.log('zzz === pathToFile2', zzz === pathToFile2 );

var pathToFile3a = require(pathToFile3);
console.log('pathToFile3', pathToFile3a);


// var a = require(zzz);
// console.log('a', a);
// return;





// var pathToFileNormalize = path.normalize(pathToFile);
// var qq = String.raw`${pathToFile}`.split('\\').join('/')
// console.log('pathToFile', pathToFile);
// console.log('pathToFileNormalize', pathToFileNormalize);
// console.log('qq', qq);

var pathToFileLength = pathToFile.length;

// console.log('path.sep', path.sep);
// console.log('pathToFile', pathToFile);
// console.log('pathToFile s', pathToFile.charCodeAt(0).toString(16).padStart(4, '0'));

// var b = pathToFile.replace(/\\/g,"/");
// console.log('b', b);

for(var i = 0; i < pathToFileLength; i++){
    console.log('pathToFile ['+ i +'] '+pathToFile[i]);
    console.log('pathToFile ['+ i +'] charCodeAt '+pathToFile[i].charCodeAt(0));
}

// var justTheName = pathToFile.split(/\\/g);
// console.log('justTheName', justTheName);

// var ex = fs.existsSync(path);
// var exN = fs.existsSync(pathToFileNormalize);

// var slit = pathToFile.split(path.sep);
// console.log('slit', slit);

// var slit1 = pathToFileNormalize.split(path.sep);
// console.log('slit1', slit1);

// // var parse = path.parse(pathToFile);


// // console.log('pathToFile', pathToFile);
// console.log('pathToFileNormalize', pathToFileNormalize);
// console.log('ex', ex);
// console.log('exN', exN);
// console.log('parse', parse);
// console.log('a', a);