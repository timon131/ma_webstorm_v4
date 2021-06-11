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
*/
let x1 = [3, 12, 1, 4];
let x2 = [3, 11, 1, 4];

console.log(corr.calc(x1, x2))

/*
let data = [{y: x1, type: 'line'}, {y: x2, type: 'line', name: '2'}];
let data2 = [{y: x1, type: 'line'}, {y: x2, type: 'line', name: '2'}];

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
        showline: false
    }
};

nplot.stack(data, layout);
nplot.stack(data2, layout)
nplot.plot()
*/