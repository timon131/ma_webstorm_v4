const data_prep = require ("../data_prep.js");
const matrixmath = require ("mathjs");
const corr = require('node-correlation');

//////////////////////////////////

class class_client {
    constructor(csvFilePath, k, n, n_test) {
        this.csvFilePath = csvFilePath;
        this.k = k;
        this.n = n;
        this.n_test = n_test;
    }

    async init() {
        this.data_train = await data_prep.prepare_housing_shuffle(this.csvFilePath, this.k, this.n);
        this.b = await calc_lr_params(this.data_train[0], this.data_train[1]);
        return this.b;
    }

    async calc_b_noisy(lambda) {
        this.b_noisy = [];
        for (let j = 0; j < this.b.length; j++) {

            // 1. step | calculate random noise
            let p = Math.random();
            //make sure that p != 0 and p != 1
            while (p === 0 || p === 1) {
                p = Math.random();
            }
            let Lap;
            if (p < 0.5) {
                Lap = lambda * Math.log(2 * p);
            } else {
                Lap = -(lambda * Math.log(2 * (1 - p)));
            }

            // 2. step | calculate b_noisy
            this.b_noisy[j] = [];
            this.b_noisy[j][0] = this.b[j][0] + Lap;
        }

        //console.log(this.b_noisy);

        return this.b_noisy;
    }

    async calc_lr_cost(b, data_test_raw, n_test) {
        //modify data_test if data_test_raw's n > n_test
        let data_test = [];
        data_test[0] = [];
        data_test[1] = [];
        if (data_test_raw[1].length > n_test) {
            //cut X to n == n_test
            let i_x;
            for (let j = 0; j < data_test_raw[0].length; j++) {
                data_test[0][j] = [];
                i_x = 0;
                while (i_x < n_test) {
                    data_test[0][j][i_x] = data_test_raw[0][j][i_x];
                    i_x++;
                }
            }
            //cut Y to n == n_test
            let i_y = 0;
            while (i_y < n_test) {
                data_test[1][i_y] = [];
                data_test[1][i_y][0] = data_test_raw[1][i_y][0];
                i_y++;
            }
        } else {
            data_test = data_test_raw;
        }
        // y_est: 1xn | b: kx1 | x_test = data_test[0]: kxn
        let y_est = matrixmath.multiply(MatrixTranspose(b), data_test[0]);
        // y_est: 1xn | data_test[1] = y_test: nx1
        let tmp_RSS = matrixmath.subtract(data_test[1], MatrixTranspose(y_est));
        // tmp_RSS: nx1
        let RSS = matrixmath.multiply(MatrixTranspose(tmp_RSS), tmp_RSS);
        this.cost = RSS[0][0];

        //console.log(this.cost);

        return this.cost;
    }
}

//////////////////////////////////

//exec(5, 1000, 100, 100, 1, 100);

async function exec(k, n, n_test, n_client, epsilon, total_incentive) {

    const csvFilePath = '/home/timmel/Documents/202105_MA/housing.csv';

    //generate clients
    let client = [];
    let all_b = [];
    for (let l = 0; l < n_client; l++) {
        client[l] = await new class_client(csvFilePath, k, n, n_test);
        all_b[l] = await client[l].init();
    }

    //calculate noisy betas
    let delta = await get_DP_delta(all_b, n_client);
    let lambda = delta / epsilon;
    let all_b_noisy = [];
    for (let l = 0; l < n_client; l++) {
        all_b_noisy[l] = await client[l].calc_b_noisy(lambda);
    }

    //calculate cost benchmark | central test data
    let all_cost_benchmark = [];
    let data_test_central = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
    for (let l = 0; l < n_client; l++) {
        all_cost_benchmark[l] = await client[l].calc_lr_cost(client[l].b, data_test_central);
    }
    let all_cost_standardized_benchmark = await standardize(all_cost_benchmark);

    //calculate cost 1 | private test data set
    let data_test_private = [];
    let all_cost_private = [];
    for (let l = 0; l < n_client; l++) {
        data_test_private[l] = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
        all_cost_private[l] = await client[l].calc_lr_cost(client[l].b, data_test_private[l]);
    }
    let all_cost_standardized_private = await standardize(all_cost_private);

    //calculate cost 2.1 | LOO_small_data_train
    let all_cost_loos_data_train = [];
    let all_loos_b_noisy = [];
    for (let l = 0; l < n_client; l++) {
        all_loos_b_noisy[l] = await calc_lr_b_noisy_loo(all_b_noisy, l);
        all_cost_loos_data_train[l] = await client[l].calc_lr_cost(all_loos_b_noisy[l], client[l].data_train);
    }
    let all_cost_standardized_loos_data_train = await standardize(all_cost_loos_data_train);

    //calculate cost 2.2 | LOO_small_data_test
    let all_cost_loos_data_test = [];
    let delta_cost_loos_data_test = [];
    for (let l = 0; l < n_client; l++) {
        all_cost_loos_data_test[l] = await client[l].calc_lr_cost(all_loos_b_noisy[l], data_test_private[l]);
        delta_cost_loos_data_test[l] = matrixmath.subtract(all_cost_private[l], all_cost_loos_data_test[l]);
    }
    let all_cost_standardized_loos_data_test = await standardize(delta_cost_loos_data_test);

    //calculate cost 3 | LOO_large
    let all_lool_b_noisy = [];
    let all_cost_lool = [];
    let counter_lool = [];
    for (let l = 0; l < n_client; l++) {
        all_lool_b_noisy[l] = await calc_lr_b_noisy_loo(all_b_noisy, l);
        counter_lool[l] = 0;
        all_cost_lool[l] = [];
    }
    //compute other clients' LOO cost on own data
    for (let l = 0; l < n_client; l++) {
        for (let l_current = 0; l_current < n_client; l_current++) {
            if (l !== l_current) {
                //all_cost_lool[l_current][counter_lool[l_current]] = await calc_lr_cost(all_lool_b_noisy[l_current], client[l].data_train, n_test);
                all_cost_lool[l_current][counter_lool[l_current]] = await calc_lr_cost(all_lool_b_noisy[l_current], data_test_private[l], n_test);
                counter_lool[l_current]++;
            }
        }
    }
    //compute median cost for every client
    let all_cost_median_lool = [];
    for (let l = 0; l < n_client; l++) {
        all_cost_median_lool[l] = matrixmath.median(all_cost_lool[l]);
    }
    let all_cost_median_standardized_lool = await standardize(all_cost_median_lool);
    //change sign
    let all_cost_median_standardized_lool_neg = matrixmath.multiply(-1, all_cost_median_standardized_lool);

    //calculate cost random
    let all_cost_random = [];
    for (let l = 0; l < n_client; l++) {
        all_cost_random[l] = Math.random();
    }
    let all_cost_standardized_random = await standardize(all_cost_random);


    //calculate Euclidean distances to benchmark
    let EuDist_private = await EuclidDistance(all_cost_standardized_benchmark, all_cost_standardized_private, 'benchmark-private');
    let EuDist_loos_train = await EuclidDistance(all_cost_standardized_benchmark, all_cost_standardized_loos_data_train, 'benchmark-LOOsmall_train');
    let EuDist_loos_test = await EuclidDistance(all_cost_standardized_benchmark, all_cost_standardized_loos_data_test, 'benchmark-LOOsmall_test');
    let EuDist_lool = await EuclidDistance(all_cost_standardized_benchmark, all_cost_median_standardized_lool_neg, 'benchmark-LOOlarge');
    let EuDist_random = await EuclidDistance(all_cost_standardized_benchmark, all_cost_standardized_random, 'benchmark-random');

    //calculate incentives
    //let incentives_central = await calc_incentives(all_cost_benchmark, total_incentive);
    //let incentives_private = await calc_incentives(all_cost_private, total_incentive);
    //let incentives_loos_data_train = await calc_incentives(all_cost_loos_data_train, total_incentive);
    //let incentives_loos_data_test = await calc_incentives(delta_cost_loos_data_test, total_incentive);

    //calculate correlation
    let corr_benchmark_private = corr.calc(all_cost_standardized_benchmark, all_cost_standardized_private);
    let corr_benchmark_LOOsmall_train = corr.calc(all_cost_standardized_benchmark, all_cost_standardized_loos_data_train);
    let corr_benchmark_LOOsmall_test = corr.calc(all_cost_standardized_benchmark, all_cost_standardized_loos_data_test);
    let corr_benchmark_LOOlarge = corr.calc(all_cost_standardized_benchmark, all_cost_median_standardized_lool_neg);
    let corr_benchmark_random = corr.calc(all_cost_standardized_benchmark, all_cost_standardized_random);

    return [
        [
            all_cost_standardized_benchmark,
            all_cost_standardized_private,
            all_cost_standardized_loos_data_train,
            all_cost_standardized_loos_data_test,
            all_cost_median_standardized_lool_neg,
            all_cost_standardized_random
        ],
        [EuDist_private, EuDist_loos_train, EuDist_loos_test, EuDist_lool, EuDist_random],
        [
            corr_benchmark_private,
            corr_benchmark_LOOsmall_train,
            corr_benchmark_LOOsmall_test,
            corr_benchmark_LOOlarge,
            corr_benchmark_random
        ]
    ]
}

//////////////////////////////////

function MatrixTranspose(a) {
    var a_rows = a.length;
    var a_cols = a[0].length;

    //initialize transposed matrix a_trans
    var a_trans = [];
    for (var j = 0; j < a_cols; j++) {
        a_trans[j] = [];
    }

    //transpose matrix
    for (var j = 0; j < a_rows; j++) {
        for (var i = 0; i < a_cols; i++) {
            a_trans[i][j] = a[j][i];
        }
    }

    return a_trans;
}
async function standardize(input_matrix) {
    let mean = matrixmath.mean(input_matrix);
    let std = matrixmath.std(input_matrix);
    let output = [];
    for (let i = 0; i < input_matrix.length; i++) {
        output[i] = (input_matrix[i] - mean) / std;
    }
    return output;
}
async function EuclidDistance(input_matrix_a, input_matrix_b, type) {
    let EuDist = matrixmath.sqrt(matrixmath.sum(matrixmath.square(matrixmath.subtract(input_matrix_a, input_matrix_b))));

    //console.log(type + ':');
    //console.log(EuDist);

    return EuDist;
}

async function calc_lr_params(x, y) {
    let xx_inv = matrixmath.inv( matrixmath.multiply(x, MatrixTranspose(x)) );
    let b = matrixmath.multiply( matrixmath.multiply(xx_inv, x), y );
    return b;
}

async function calc_lr_cost(b, data_test_raw, n_test) {
    //modify data_test if data_test_raw's n > n_test
    let data_test = [];
    data_test[0] = [];
    data_test[1] = [];
    if (data_test_raw[1].length > n_test) {
        //cut X to n == n_test
        let i_x;
        for (let j = 0; j < data_test_raw[0].length; j++) {
            data_test[0][j] = [];
            i_x = 0;
            while (i_x < n_test) {
                data_test[0][j][i_x] = data_test_raw[0][j][i_x];
                i_x++;
            }
        }
        //cut Y to n == n_test
        let i_y = 0;
        while (i_y < n_test) {
            data_test[1][i_y] = [];
            data_test[1][i_y][0] = data_test_raw[1][i_y][0];
            i_y++;
        }
    } else {
        data_test = data_test_raw;
    }
    // y_est: 1xn | b: kx1 | x_test = data_test[0]: kxn
    let y_est = matrixmath.multiply(MatrixTranspose(b), data_test[0]);
    // y_est: 1xn | data_test[1] = y_test: nx1
    let tmp_RSS = matrixmath.subtract(data_test[1], MatrixTranspose(y_est));
    // tmp_RSS: nx1
    let RSS = matrixmath.multiply(MatrixTranspose(tmp_RSS), tmp_RSS);
    //RSS: 1x1

    //console.log(RSS[0][0]);

    return RSS[0][0];
}

async function get_DP_delta(all_b, n_client) {
    //console.log("all_b:");
    //console.log(all_b)
    let b_max;
    let b_min;
    let delta;

    for (let l = 0; l < n_client; l++) {
        if (l === 0) {
            b_max = matrixmath.max(matrixmath.max(all_b[l]));
            b_min = matrixmath.min(matrixmath.min(all_b[l]));
        }

        let tmp_b_max = matrixmath.max(matrixmath.max(all_b[l]));
        if (tmp_b_max > b_max) {
            b_max = tmp_b_max;
        }
        let tmp_b_min = matrixmath.min(matrixmath.min(all_b[l]));
        if (tmp_b_min < b_min) {
            b_min = tmp_b_min;
        }
        delta = b_max - b_min;
    }

    //console.log(delta);

    return delta;
}

async function calc_delta(target, actual, incentive_type) {
    let delta = matrixmath.subtract(actual, target);
    console.log('\n' + incentive_type + ':');
    //console.log(delta);

    let mean = matrixmath.mean(delta);
    console.log('mean:');
    console.log(mean);

    let variance = matrixmath.variance(delta, 'uncorrected');
    console.log('variance:');
    console.log(variance);

    return delta;
}

async function calc_incentives(all_cost, total_incentive) {
    //standardize all_cost and make change sign
    let mean = matrixmath.mean(all_cost);
    let std = matrixmath.std(all_cost, 'uncorrected');
    let all_cost_stand = [];
    for (let l = 0; l < all_cost.length; l++) {
        all_cost_stand[l] = -(all_cost[l] - mean) / std;
    }

    //set negative entries = 0
    let incentives = [];
    for (let l = 0; l < all_cost.length; l++) {
        if (all_cost_stand[l] < 0) { incentives[l] = 0; }
        else { incentives[l] = all_cost_stand[l] }
    }

    //scale to range [0, 1]
    let sum = matrixmath.sum(incentives);
    for (let l = 0; l < all_cost.length; l++) {
        incentives[l] = incentives[l] / sum;
    }

    //multiply with total_incentive
    for (let l = 0; l < all_cost.length; l++) {
        incentives[l] *= total_incentive;
    }

    return incentives;
}

async function calc_lr_b_noisy_loo(all_b_noisy, client_l) {
    //calculates LOO weight for client l

    //console.log(all_b_noisy)

    let loo_all_b_noisy = [];
    let i = 0;
    for (let l = 0; l < all_b_noisy.length; l++) {
        if (l != client_l) {
            loo_all_b_noisy[i] = all_b_noisy[l];
            i++;
        }
    }
    let loo_b_noisy = matrixmath.mean(loo_all_b_noisy, 0);

    //console.log(loo_b_noisy);

    return loo_b_noisy;
}

//////////////////////////////////

module.exports = {
    exec
};