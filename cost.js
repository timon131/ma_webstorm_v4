const data_prep = require ("./data_prep.js");
const matrixmath = require ("mathjs");

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
                }
            }
            //cut Y to n == n_test
            let i_y = 0;
            while (i_y < n_test) {
                data_test[1][i_y] = [];
                data_test[1][i_y][0] = data_test_raw[1][i_y][0];
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

exec(5, 1000, 100, 10, 1, 100);

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

    //calculate cost 1 | public, central test data set
    let data_test_central = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
    let all_cost_central = [];
    for (let l = 0; l < n_client; l++) {
        all_cost_central[l] = await client[l].calc_lr_cost(client[l].b, data_test_central);
    }

    //calculate cost 2 | private test data set
    let data_test_private = [];
    let all_cost_private = [];
    for (let l = 0; l < n_client; l++) {
        data_test_private[l] = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
        all_cost_private[l] = await client[l].calc_lr_cost(client[l].b, data_test_private[l]);
    }

    //calculate cost 3 | LOO_small
    let all_cost_loos = [];
    let all_loos_b_noisy = [];
    for (let l = 0; l < n_client; l++) {
        all_loos_b_noisy[l] = await calc_lr_cost_loo(all_b_noisy, l);
        all_cost_loos[l] = await client[l].calc_lr_cost(all_loos_b_noisy[l], client[l].data_train);
    }

    //calculate cost 4 | LOO_large

    //calculate incentives
    let incentives_central = await calc_incentives(all_cost_central, total_incentive);
    let incentives_private = await calc_incentives(all_cost_private, total_incentive);
    let incentives_loos = await calc_incentives(all_cost_loos, total_incentive);

    //calculate incentive_delta's
    let cost_delta_private = await calc_delta(incentives_central, incentives_private, 'private - central');
    let cost_delta_loos = await calc_delta(incentives_central, incentives_loos, 'loos - central');


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

async function calc_lr_params(x, y) {
    let xx_inv = matrixmath.inv( matrixmath.multiply(x, MatrixTranspose(x)) );
    let b = matrixmath.multiply( matrixmath.multiply(xx_inv, x), y );
    return b;
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
    console.log(incentive_type + ':');
    console.log(delta);

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

async function calc_lr_cost_loo(all_b_noisy, client_l) {

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