const matrixmath = require ("mathjs");
const nplot = require('nodeplotlib');
const corr = require('node-correlation');

/*
let n = 5;
let n_test = 2;
let client_l = 2;
let n_clients = 3;

let a = {
    x: [12, 23, 31, 49, 56],
    y: [1, 2, 1, 5, 2],
    type: 'scatter'
};
let b = {
    x: [13, 22, 32, 50, 54],
    y: [4, 3, 2, 1, 3],
    type: 'scatter'
};

let data = [a, b];

plotly.newPlot('myDiv', data);

let x1 = [3, 12, 1, 4];
let x2 = [3, 11, 1, 4];
let x3 = [1,2,3,4,5,6,7,8,9,10,2,3,4,5,6,7,8,9,3,4,5,6,7,8,4,5,6,7,5,6]
let x4 = [0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8,0.9,1,0.2,0.3,0.45,0.5,0.55,0.6,0.7,0.8,0.9,0.41,0.43,0.52,0.501,0.51]



let data = [{y: x1, type: 'line'}, {y: x2, type: 'line', name: '2'}];
let data2 = [{x: x4, type: 'histogram'}];

let layout = {
    title: 'Test',
    xaxis: {
        title: 'client',
        showgrid: false,
        zeroline: false,
        nticks: 2
    },
    yaxis: {
        title: 'Euler distance',
        width: 0.1,
        showline: false
    }
};

nplot.stack(data, layout);
nplot.stack(data2, layout)
nplot.plot()
*/

let x = [
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5],
    [1, 2, 3, 4, 5]
];
let y = NaN

console.log(matrixmath.mean(x, 0))