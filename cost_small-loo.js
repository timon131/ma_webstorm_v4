const data_prep = require ("./data_prep.js");
const matrixmath = require ("mathjs");

////////////////////////////////////////////////

const csvFilePath = '/home/timmel/Documents/202105_MA/housing.csv';


var b_max;
var b_min;
var delta;
var epsilon = 0.5;
exec(5, 100, 20, 10);

async function exec(k, n, n_test, n_clients) {
    //calculate b and RSS
    let data_test = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
    let b = [];
    let RSS = [];
    let b_RSS;
    for (let l = 0; l < n_clients; l++) {
        b_RSS = await create_client(k, n, data_test, l);
        b[l] = b_RSS[0];
        RSS[l] = b_RSS[1];
    }
    //console.log(RSS);

    //calculate b_noisy
    let b_noisy = [];
    for (let l = 0; l < n_clients; l++) {
        b_noisy[l] = await calc_b_noisy(b[l]);
    }


}


async function create_client(k, n, data_test, l) {
    let data = await data_prep.prepare_housing_shuffle(csvFilePath, k, n);
    let b = await calc_lr_params(data[0], data[1]);
    //console.log(b);
    await get_DP_delta(b, l);
    let RSS = await calc_lr_cost(b, data_test);
    return [b, RSS];
}

async function calc_lr_params(x, y) {
    let xx_inv = matrixmath.inv( matrixmath.multiply(x, MatrixTranspose(x)) );
    let b = matrixmath.multiply( matrixmath.multiply(xx_inv, x), y );
    return b;
}

async function calc_lr_cost(b, data_test) {
    let y_est = matrixmath.multiply( MatrixTranspose(b), data_test[0] );
    // y_est: 1xn | data_test[1] = y_test: nx1
    let tmp_RSS = matrixmath.subtract(data_test[1], MatrixTranspose(y_est));
    // tmp_RSS: nx1
    let RSS = matrixmath.multiply( MatrixTranspose(tmp_RSS), tmp_RSS );
    //console.log(RSS[0][0])
    return RSS[0][0];
}

async function get_DP_delta(b, l) {
    if (l===0) {
        b_max = matrixmath.max( matrixmath.max(b) );
        b_min = matrixmath.min( matrixmath.min(b) );
    }

    let tmp_b_max = matrixmath.max( matrixmath.max(b) );
    if (tmp_b_max > b_max) {b_max = tmp_b_max;}
    let tmp_b_min = matrixmath.min( matrixmath.min(b) );
    if (tmp_b_min < b_min) {b_min = tmp_b_min;}
    delta = b_max - b_min;
}

async function calc_b_noisy(b) {
    let lambda = delta / epsilon;
    let b_noisy = [];
    for (let j = 0; j < b.length; j++) {
        //
        // 1. step | calculate random noise
        //
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

        //
        // 2. step | calculate b_noisy
        //
        b_noisy[j] = b[j][0] + Lap;
    }
    return b_noisy;
}

async function print_difference_DP(b, b_noisy, n_clients) {
    //calculate true b mean
    let b_mean = [];
    let b_mean_sum = [];
    for (let j = 0; j < b[0].length; j++) {
        b_mean_sum[j] = 0;
    }
    for (let l = 0; l < n_clients; l++) {
        for (let j = 0; j < b[l].length; j++) {
            b_mean_sum[j] += b[l][j][0];
        }
    }
    for (let j = 0; j < b[0].length; j++) {
        b_mean[j] = b_mean_sum[j] / n_clients;
    }
    console.log(b_mean);

    //calculate noisy b mean
    let b_noisy_mean = [];
    let b_noisy_mean_sum = [];
    for (let j = 0; j < b_noisy[0].length; j++) {
        b_noisy_mean_sum[j] = 0;
    }
    for (let l = 0; l < n_clients; l++) {
        for (let j = 0; j < b_noisy[l].length; j++) {
            b_noisy_mean_sum[j] += b_noisy[l][j];
        }
    }
    for (let j = 0; j < b_noisy[0].length; j++) {
        b_noisy_mean[j] = b_noisy_mean_sum[j] / n_clients;
    }
    console.log(b_noisy_mean);
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