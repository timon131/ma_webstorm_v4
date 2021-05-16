const normalize = require('array-normalize');
const matrixmath = require ("mathjs");

let x = [12, 23, 31, 49, 56];

let mean = matrixmath.mean(x);
let std = matrixmath.std(x, 'uncorrected');
let x_stand = [];
for (let l = 0; l < x.length; l++) {
    x_stand[l] = (x[l] - mean) / std;
}

console.log(x_stand);