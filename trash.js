const normalize = require('array-normalize');
const matrixmath = require ("mathjs");

let n = 5;
let n_test = 2;
let client_l = 2;
let n_clients = 3;

let x = [[12, 23, 31, 49, 56], [12, 23, 31, 49, 57], [12, 23, 31, 49, 58]];
let loo_x = [];

let i = 0;
for (let l = 0; l < n_clients; l++) {
    if (l != client_l) {
        loo_x[i] = x[l];
        i++;
    }
}

let x_mean = matrixmath.mean(loo_x, 0);

console.log(loo_x);
console.log(x_mean);