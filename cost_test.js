const cost_calc = require('./cost_experimental');
const matrixmath = require ("mathjs");
const nplot = require('nodeplotlib');

exec(100)

async function exec(n_test) {
    //run tests
    let score = [];
    score[0] = [];
    score[1] = [];
    score[2] = [];
    score[3] = [];
    let score_tmp;
    for (let i = 0; i < n_test; i++) {
        score_tmp = await cost_calc.exec(5, 1000, 100, 100, 1, 100);
        score[0][i] = score_tmp[0];
        score[1][i] = score_tmp[1];
        score[2][i] = score_tmp[2];
        score[3][i] = score_tmp[3];
    }

    //analyse tests
    let mean_benchmark_private = matrixmath.mean(score[0]);
    let mean_benchmark_LOOsmall_train = matrixmath.mean(score[1]);
    let mean_benchmark_LOOsmall_test = matrixmath.mean(score[2]);
    let mean_benchmark_LOOlarge = matrixmath.mean(score[3]);
    let var_benchmark_private = matrixmath.variance(score[0], 'uncorrected');
    let var_benchmark_LOOsmall_train = matrixmath.variance(score[1], 'uncorrected');
    let var_benchmark_LOOsmall_test = matrixmath.variance(score[2], 'uncorrected');
    let var_benchmark_LOOlarge = matrixmath.variance(score[3], 'uncorrected');

    //print results
    console.log('benchmark-private:');
    console.log('mean: ' + mean_benchmark_private);
    console.log('var: ' + var_benchmark_private);
    console.log('benchmark-LOOsmall_train:');
    console.log('mean: ' + mean_benchmark_LOOsmall_train);
    console.log('var: ' + var_benchmark_LOOsmall_train);
    console.log('benchmark-LOOsmall_test:');
    console.log('mean: ' + mean_benchmark_LOOsmall_test);
    console.log('var: ' + var_benchmark_LOOsmall_test);
    console.log('benchmark-LOOlarge:');
    console.log('mean: ' + mean_benchmark_LOOlarge);
    console.log('var: ' + var_benchmark_LOOlarge);

    //plot results
    let data = [
        {y: score[0], type: 'line', name: 'benchmark <> private'},
        {y: score[1], type: 'line', name: 'benchmark <> LOOsmall_train'},
        {y: score[2], type: 'line', name: 'benchmark <> LOOsmall_test'},
        {y: score[3], type: 'line', name: 'benchmark <> LOOlarge'},
    ];

    let layout = {
        title: 'Overview of cost approaches',
        xaxis: {
            title: 'client',
            showgrid: false,
            zeroline: false,
            nticks: 10
        },
        yaxis: {
            title: 'euclidean distance',
            showline: false
        }
    };

    nplot.plot(data, layout)
}