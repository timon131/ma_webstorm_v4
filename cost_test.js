const cost_calc = require('./cost_experimental');
const matrixmath = require ("mathjs");
const nplot = require('nodeplotlib');

exec(100, 200)

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
    let EuDist = [];
    EuDist[0] = [];
    EuDist[1] = [];
    EuDist[2] = [];
    EuDist[3] = [];
    let corr = [];
    corr[0] = [];
    corr[1] = [];
    corr[2] = [];
    corr[3] = [];
    let test;
    for (let i = 0; i < number_of_tests; i++) {
        test = await cost_calc.exec(5, 1000, 100, n_client, 0.7, 100);

        //cost
        cost[0][i] = test[0][0];    //benchmark
        cost[1][i] = test[0][1];    //private
        cost[2][i] = test[0][2];    //LOO_small_train
        cost[3][i] = test[0][3];    //LOO_small_test
        cost[4][i] = test[0][4];    //LOO_large

        //Euclidean distances
        EuDist[0][i] = test[1][0];  //private
        EuDist[1][i] = test[1][1];  //LOO_small_train
        EuDist[2][i] = test[1][2];  //LOO_small_test
        EuDist[3][i] = test[1][3];  //LOO_large

        //correlation
        corr[0][i] = test[2][0];
        corr[1][i] = test[2][1];
        corr[2][i] = test[2][2];
        corr[3][i] = test[2][3];
    }


    //
    // analyse tests
    //

    //cost
    let CostDiff_benchmark_private = [];
    let CostDiff_benchmark_LOOsmall_train = [];
    let CostDiff_benchmark_LOOsmall_test = [];
    let CostDiff_benchmark_LOOlarge = [];
    for (let l = 0; l < n_client; l++) {
        CostDiff_benchmark_private[l] = [];
        CostDiff_benchmark_LOOsmall_train[l] = [];
        CostDiff_benchmark_LOOsmall_test[l] = [];
        CostDiff_benchmark_LOOlarge[l] = [];
        for (let i = 0; i < number_of_tests; i++) {
            CostDiff_benchmark_private[l][i] = cost[1][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOsmall_train[l][i] = cost[2][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOsmall_test[l][i] = cost[3][i][l] - cost[0][i][l];
            CostDiff_benchmark_LOOlarge[l][i] = cost[4][i][l] - cost[0][i][l];
        }
    }
    let CostDiff_median_benchmark_private = [];
    let CostDiff_median_benchmark_LOOsmall_train = [];
    let CostDiff_median_benchmark_LOOsmall_test = [];
    let CostDiff_median_benchmark_LOOlarge = [];
    let CostDiff_var_benchmark_private = [];
    let CostDiff_var_benchmark_LOOsmall_train = [];
    let CostDiff_var_benchmark_LOOsmall_test = [];
    let CostDiff_var_benchmark_LOOlarge = [];
    for (let l = 0; l < n_client; l++) {
        CostDiff_median_benchmark_private[l] = matrixmath.median(CostDiff_benchmark_private[l]);
        CostDiff_median_benchmark_LOOsmall_train[l] = matrixmath.median(CostDiff_benchmark_LOOsmall_train[l]);
        CostDiff_median_benchmark_LOOsmall_test[l] = matrixmath.median(CostDiff_benchmark_LOOsmall_test[l]);
        CostDiff_median_benchmark_LOOlarge[l] = matrixmath.median(CostDiff_benchmark_LOOlarge[l]);
        CostDiff_var_benchmark_private[l] = matrixmath.variance(CostDiff_benchmark_private[l], 'uncorrected');
        CostDiff_var_benchmark_LOOsmall_train[l] = matrixmath.variance(CostDiff_benchmark_LOOsmall_train[l], 'uncorrected');
        CostDiff_var_benchmark_LOOsmall_test[l] = matrixmath.variance(CostDiff_benchmark_LOOsmall_test[l], 'uncorrected');
        CostDiff_var_benchmark_LOOlarge[l] = matrixmath.variance(CostDiff_benchmark_LOOlarge[l], 'uncorrected');
    }

    //Euclidean distances
    let EuDist_mean_benchmark_private = matrixmath.mean(EuDist[0]);
    let EuDist_mean_benchmark_LOOsmall_train = matrixmath.mean(EuDist[1]);
    let EuDist_mean_benchmark_LOOsmall_test = matrixmath.mean(EuDist[2]);
    let EuDist_mean_benchmark_LOOlarge = matrixmath.mean(EuDist[3]);
    let EuDist_var_benchmark_private = matrixmath.variance(EuDist[0], 'uncorrected');
    let EuDist_var_benchmark_LOOsmall_train = matrixmath.variance(EuDist[1], 'uncorrected');
    let EuDist_var_benchmark_LOOsmall_test = matrixmath.variance(EuDist[2], 'uncorrected');
    let EuDist_var_benchmark_LOOlarge = matrixmath.variance(EuDist[3], 'uncorrected');

    //Correlation
    let corr_mean_benchmark_private = matrixmath.mean(corr[0]);
    let corr_mean_benchmark_LOOsmall_train = matrixmath.mean(corr[1]);
    let corr_mean_benchmark_LOOsmall_test = matrixmath.mean(corr[2]);
    let corr_mean_benchmark_LOOlarge = matrixmath.mean(corr[3]);
    let corr_var_benchmark_private = matrixmath.variance(corr[0], 'uncorrected');
    let corr_var_benchmark_LOOsmall_train = matrixmath.variance(corr[1], 'uncorrected');
    let corr_var_benchmark_LOOsmall_test = matrixmath.variance(corr[2], 'uncorrected');
    let corr_var_benchmark_LOOlarge = matrixmath.variance(corr[3], 'uncorrected');


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

    //plot CostDiff
    let CostDiff_data = [
        {y: CostDiff_median_benchmark_private, type: 'line', name: 'median: benchmark <> private'},
        {y: CostDiff_median_benchmark_LOOsmall_train, type: 'line', name: 'median: benchmark <> LOOsmall_train'},
        {y: CostDiff_median_benchmark_LOOsmall_test, type: 'line', name: 'median: benchmark <> LOOsmall_test'},
        {y: CostDiff_median_benchmark_LOOlarge, type: 'line', name: 'median: benchmark <> LOOlarge'},
        {y: CostDiff_var_benchmark_private, type: 'line', name: 'variance: benchmark <> private'},
        {y: CostDiff_var_benchmark_LOOsmall_train, type: 'line', name: 'variance: benchmark <> LOOsmall_train'},
        {y: CostDiff_var_benchmark_LOOsmall_test, type: 'line', name: 'variance: benchmark <> LOOsmall_test'},
        {y: CostDiff_var_benchmark_LOOlarge, type: 'line', name: 'variance: benchmark <> LOOlarge'},
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
        {y: EuDist[3], type: 'line', name: 'benchmark <> LOOlarge'}
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
        {y: corr[3], type: 'line', name: 'benchmark <> LOOlarge'}
    ];

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

    nplot.stack(Corr_data, Corr_layout);

    nplot.plot();
}