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
            this.b_noisy[j] = this.b[j][0] + Lap;
        }
    }

    async calc_lr_cost(b, data_test) {
        let y_est = matrixmath.multiply( MatrixTranspose(b), data_test[0] );
        // y_est: 1xn | data_test[1] = y_test: nx1
        let tmp_RSS = matrixmath.subtract(data_test[1], MatrixTranspose(y_est));
        // tmp_RSS: nx1
        let RSS = matrixmath.multiply( MatrixTranspose(tmp_RSS), tmp_RSS );
        console.log(RSS[0][0])

        this.cost = RSS[0][0];
    }

}

//////////////////////////////////

exec(5, 100, 20, 10, 0.5);

async function exec(k, n, n_test, n_client, epsilon) {

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
    for (let l = 0; l < n_client; l++) {
        await client[l].calc_b_noisy(lambda);
    }

    //calculate cost on public data set
    let data_test_central = await data_prep.prepare_housing_shuffle(csvFilePath, k, n_test);
    for (let l = 0; l < n_client; l++) {
        await client[l].calc_lr_cost(client[l].b, data_test_central);
    }

}

//////////////////////////////////

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

    return delta;
}

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