const cost_calc = require('./cost_experimental_v3');
const matrixmath = require ("mathjs");
const nplot = require('nodeplotlib');

exec(10, 200)

async function exec(number_of_tests, n_client) {

    //
    // run tests
    //

    let cost = [];
    cost[0] = [];
    cost[1] = [];
    cost[2] = [];
    cost[3] = [];
    cost[4] = [];
    cost[5] = [];
    let EuDist = [];
    EuDist[0] = [];
    EuDist[1] = [];
    EuDist[2] = [];
    EuDist[3] = [];
    EuDist[4] = [];
    let corr = [];
    corr[0] = [];
    corr[1] = [];
    corr[2] = [];
    corr[3] = [];
    corr[4] = [];
    let test;
    for (let i = 0; i < number_of_tests; i++) {
        test = await cost_calc.exec(5, 1000, 100, n_client, 99999999999999, 100);

        //cost
        cost[0][i] = test[0][0];    //benchmark
        cost[1][i] = test[0][1];    //private
        cost[2][i] = test[0][2];    //LOOsmall_train
        cost[3][i] = test[0][3];    //LOOsmall_test
        cost[4][i] = test[0][4];    //LOOlarge
        cost[5][i] = test[0][5];    //random

        //Euclidean distances
        EuDist[0][i] = test[1][0];  //private
        EuDist[1][i] = test[1][1];  //LOOsmall_train
        EuDist[2][i] = test[1][2];  //LOOsmall_test
        EuDist[3][i] = test[1][3];  //LOOlarge
        EuDist[4][i] = test[1][4];  //random

        //correlation
        corr[0][i] = test[2][0];    //private
        corr[1][i] = test[2][1];    //LOOsmall_train
        corr[2][i] = test[2][2];    //LOOsmall_test
        corr[3][i] = test[2][3];    //LOOlarge
        corr[4][i] = test[2][4];    //random
    }


    //
    // analyse tests
    //

    //cost
    let CostDiff_benchmark_private = [];
    let CostDiff_benchmark_LOOsmall_train = [];
    let CostDiff_benchmark_LOOsmall_test = [];
    let CostDiff_benchmark_LOOlarge = [];
    let CostDiff_benchmark_random = [];
    for (let l = 0; l < n_client; l++) {
        CostDiff_benchmark_private[l] = [];
        CostDiff_benchmark_LOOsmall_train[l] = [];
        CostDiff_benchmark_LOOsmall_test[l] = [];
        CostDiff_benchmark_LOOlarge[l] = [];
        CostDiff_benchmark_random[l] = [];
        for (let i = 0; i < number_of_tests; i++) {
            CostDiff_benchmark_private[l][i] = cost[1][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOsmall_train[l][i] = cost[2][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOsmall_test[l][i] = cost[3][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOlarge[l][i] = cost[4][i][l] - cost[0][i][l];
            CostDiff_benchmark_random[l][i] = cost[5][i][l] - cost[0][i][l];
        }
    }
    let CostDiff_median_benchmark_private = [];
    let CostDiff_median_benchmark_LOOsmall_train = [];
    let CostDiff_median_benchmark_LOOsmall_test = [];
    let CostDiff_median_benchmark_LOOlarge = [];
    let CostDiff_median_benchmark_random = [];
    let CostDiff_var_benchmark_private = [];
    let CostDiff_var_benchmark_LOOsmall_train = [];
    let CostDiff_var_benchmark_LOOsmall_test = [];
    let CostDiff_var_benchmark_LOOlarge = [];
    let CostDiff_var_benchmark_random = [];
    for (let l = 0; l < n_client; l++) {
        //median
        CostDiff_median_benchmark_private[l] = matrixmath.median(CostDiff_benchmark_private[l]);
        CostDiff_median_benchmark_LOOsmall_train[l] = matrixmath.median(CostDiff_benchmark_LOOsmall_train[l]);
        CostDiff_median_benchmark_LOOsmall_test[l] = matrixmath.median(CostDiff_benchmark_LOOsmall_test[l]);
        CostDiff_median_benchmark_LOOlarge[l] = matrixmath.median(CostDiff_benchmark_LOOlarge[l]);
        CostDiff_median_benchmark_random[l] = matrixmath.median(CostDiff_benchmark_random[l]);
        //variance
        CostDiff_var_benchmark_private[l] = matrixmath.variance(CostDiff_benchmark_private[l], 'uncorrected');
        CostDiff_var_benchmark_LOOsmall_train[l] = matrixmath.variance(CostDiff_benchmark_LOOsmall_train[l], 'uncorrected');
        CostDiff_var_benchmark_LOOsmall_test[l] = matrixmath.variance(CostDiff_benchmark_LOOsmall_test[l], 'uncorrected');
        CostDiff_var_benchmark_LOOlarge[l] = matrixmath.variance(CostDiff_benchmark_LOOlarge[l], 'uncorrected');
        CostDiff_var_benchmark_random[l] = matrixmath.variance(CostDiff_benchmark_random[l], 'uncorrected');
    }

    //Euclidean distances
    //mean
    let EuDist_mean_benchmark_private = matrixmath.mean(EuDist[0]);
    let EuDist_mean_benchmark_LOOsmall_train = matrixmath.mean(EuDist[1]);
    let EuDist_mean_benchmark_LOOsmall_test = matrixmath.mean(EuDist[2]);
    let EuDist_mean_benchmark_LOOlarge = matrixmath.mean(EuDist[3]);
    let EuDist_mean_benchmark_random = matrixmath.mean(EuDist[4]);
    //variance
    let EuDist_var_benchmark_private = matrixmath.variance(EuDist[0], 'uncorrected');
    let EuDist_var_benchmark_LOOsmall_train = matrixmath.variance(EuDist[1], 'uncorrected');
    let EuDist_var_benchmark_LOOsmall_test = matrixmath.variance(EuDist[2], 'uncorrected');
    let EuDist_var_benchmark_LOOlarge = matrixmath.variance(EuDist[3], 'uncorrected');
    let EuDist_var_benchmark_random = matrixmath.variance(EuDist[4], 'uncorrected');

    //Correlation
    //mean
    let corr_mean_benchmark_private = matrixmath.mean(corr[0]);
    let corr_mean_benchmark_LOOsmall_train = matrixmath.mean(corr[1]);
    let corr_mean_benchmark_LOOsmall_test = matrixmath.mean(corr[2]);
    let corr_mean_benchmark_LOOlarge = matrixmath.mean(corr[3]);
    let corr_mean_benchmark_random = matrixmath.mean(corr[4]);
    //variance
    let corr_var_benchmark_private = matrixmath.variance(corr[0], 'uncorrected');
    let corr_var_benchmark_LOOsmall_train = matrixmath.variance(corr[1], 'uncorrected');
    let corr_var_benchmark_LOOsmall_test = matrixmath.variance(corr[2], 'uncorrected');
    let corr_var_benchmark_LOOlarge = matrixmath.variance(corr[3], 'uncorrected');
    let corr_var_benchmark_random = matrixmath.variance(corr[4], 'uncorrected');


    //
    // output results
    //

    //print euclidean distance
    console.log('EuDist_benchmark-private:');
    console.log('mean: ' + EuDist_mean_benchmark_private);
    console.log('var: ' + EuDist_var_benchmark_private);
    console.log('EuDist_benchmark-LOOsmall_train:');
    console.log('mean: ' + EuDist_mean_benchmark_LOOsmall_train);
    console.log('var: ' + EuDist_var_benchmark_LOOsmall_train);
    console.log('EuDist_benchmark-LOOsmall_test:');
    console.log('mean: ' + EuDist_mean_benchmark_LOOsmall_test);
    console.log('var: ' + EuDist_var_benchmark_LOOsmall_test);
    console.log('EuDist_benchmark-LOOlarge:');
    console.log('mean: ' + EuDist_mean_benchmark_LOOlarge);
    console.log('var: ' + EuDist_var_benchmark_LOOlarge);
    console.log('EuDist_benchmark-random:');
    console.log('mean: ' + EuDist_mean_benchmark_random);
    console.log('var: ' + EuDist_var_benchmark_random);

    //print correlation
    console.log('Corr_benchmark-private:');
    console.log('mean: ' + corr_mean_benchmark_private);
    console.log('var: ' + corr_var_benchmark_private);
    console.log('Corr_benchmark-LOOsmall_train:');
    console.log('mean: ' + corr_mean_benchmark_LOOsmall_train);
    console.log('var: ' + corr_var_benchmark_LOOsmall_train);
    console.log('Corr_benchmark-LOOsmall_test:');
    console.log('mean: ' + corr_mean_benchmark_LOOsmall_test);
    console.log('var: ' + corr_var_benchmark_LOOsmall_test);
    console.log('Corr_benchmark-LOOlarge:');
    console.log('mean: ' + corr_mean_benchmark_LOOlarge);
    console.log('var: ' + corr_var_benchmark_LOOlarge);
    console.log('Corr_benchmark-random:');
    console.log('mean: ' + corr_mean_benchmark_random);
    console.log('var: ' + corr_var_benchmark_random);

    //plot CostDiff
    let CostDiff_data = [
        //median
        {y: CostDiff_median_benchmark_private, type: 'line', name: 'median: benchmark <> private'},
        {y: CostDiff_median_benchmark_LOOsmall_train, type: 'line', name: 'median: benchmark <> LOOsmall_train'},
        {y: CostDiff_median_benchmark_LOOsmall_test, type: 'line', name: 'median: benchmark <> LOOsmall_test'},
        {y: CostDiff_median_benchmark_LOOlarge, type: 'line', name: 'median: benchmark <> LOOlarge'},
        {y: CostDiff_median_benchmark_random, type: 'line', name: 'median: benchmark <> random'},
        //variance
        {y: CostDiff_var_benchmark_private, type: 'line', name: 'variance: benchmark <> private'},
        {y: CostDiff_var_benchmark_LOOsmall_train, type: 'line', name: 'variance: benchmark <> LOOsmall_train'},
        {y: CostDiff_var_benchmark_LOOsmall_test, type: 'line', name: 'variance: benchmark <> LOOsmall_test'},
        {y: CostDiff_var_benchmark_LOOlarge, type: 'line', name: 'variance: benchmark <> LOOlarge'},
        {y: CostDiff_var_benchmark_random, type: 'line', name: 'variance: benchmark <> random'}
    ];

    let CostDiff_layout = {
        title: 'Overview of cost approaches: Cost delta per client',
        xaxis: {
            title: '# of client',
            showgrid: false,
            zeroline: false,
            nticks: 10
        },
        yaxis: {
            title: 'cost delta',
            showline: false
        }
    };

    nplot.stack(CostDiff_data, CostDiff_layout);

    //plot EuDist
    let EuDist_data = [
        {y: EuDist[0], type: 'line', name: 'benchmark <> private'},
        {y: EuDist[1], type: 'line', name: 'benchmark <> LOOsmall_train'},
        {y: EuDist[2], type: 'line', name: 'benchmark <> LOOsmall_test'},
        {y: EuDist[3], type: 'line', name: 'benchmark <> LOOlarge'},
        {y: EuDist[4], type: 'line', name: 'benchmark <> random'}
    ];

    let EuDist_layout = {
        title: 'Overview of cost approaches: Euclidean distance per test',
        xaxis: {
            title: '# of test',
            showgrid: false,
            zeroline: false,
            nticks: 10
        },
        yaxis: {
            title: 'euclidean distance',
            showline: false
        }
    };

    nplot.stack(EuDist_data, EuDist_layout)

    //plot correlation
    let Corr_data = [
        {y: corr[0], type: 'line', name: 'benchmark <> private'},
        {y: corr[1], type: 'line', name: 'benchmark <> LOOsmall_train'},
        {y: corr[2], type: 'line', name: 'benchmark <> LOOsmall_test'},
        {y: corr[3], type: 'line', name: 'benchmark <> LOOlarge'},
        {y: corr[4], type: 'line', name: 'benchmark <> random'}
    ];

    let Corr_data_hist = [
        {x: corr[1], type: 'histogram', name: 'benchmark <> LOOsmall_train'}
    ]

    let Corr_layout = {
        title: 'Overview of cost approaches: Correlation per test',
        xaxis: {
            title: '# of test',
            showgrid: false,
            zeroline: false,
            nticks: 10
        },
        yaxis: {
            title: 'correlation',
            showline: false
        }
    };
    let Corr_layout_hist = {
        title: 'Overview of cost approaches: Correlation LOOsmall_train',
        xaxis: {
            title: 'correlation',
            showgrid: false,
            zeroline: false,
            width: 0.01,
            range: [-1, 1],
            nticks: 20
        },
        yaxis: {
            title: 'frequency',
            showline: false
        }
    };

    nplot.stack(Corr_data, Corr_layout);
    nplot.stack(Corr_data_hist, Corr_layout_hist)

    nplot.plot();
}