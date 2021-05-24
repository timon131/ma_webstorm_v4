const normalize = require('array-normalize');
const matrixmath = require ("mathjs");

let n = 5;
let n_test = 2;
let client_l = 2;
let n_clients = 3;

let x = [12, 23, 31, 49, 56];
let y = [13, 22, 32, 50, 54];

let eucl_dist = matrixmath.sqrt( matrixmath.sum( matrixmath.square( matrixmath.subtract(x, y) ) ) );

console.log(diff)

