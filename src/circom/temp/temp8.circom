//include "../../../circomlib/circuits/gates.circom";
include "./mycircomlib/matrixmult.circom";
include "./mycircomlib/multiply-xx.circom";
//include "./mycircomlib/range.circom";
//include "./mycircomlib/abs_diff.circom";
//include "./mycircomlib/DP_noise.circom";
//include "./mycircomlib/matrixnorms.circom";
include "./mycircomlib/merkleproof.circom";
//include "./mycircomlib/xx_rangeproof.circom";
//include "./mycircomlib/b_rangeproof.circom";
include "./mycircomlib/power.circom";
//include "../../../circomlib/circuits/comparators.circom";


/////////////////////////////////////////////////


template LinRegCost(k, n, n_test, dec, merkle_level, hash_alg) {
    signal private input in_x_pos[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_y_pos[n][1];
    signal private input in_y_sign[n][1];
    signal private input in_xx_inv_pos[k][k];
    signal private input in_xx_inv_sign[k][k];
    signal private input in_x_test_pos[k][n_test];
    signal private input in_x_test_sign[k][n_test];
    signal private input in_y_test_pos[n_test][1];
    signal private input in_y_test_sign[n_test][1];
    //public inputs:
    signal input in_k;
    signal input in_n;
    signal input in_n_test;
    signal input in_dec;
    signal input in_xy_merkleroot;

    signal output out;


    //
    // 0. step | Prerequisites: make sure that input variables are correct
    //

    assert (
        k == in_k &&
        n == in_n &&
        n_test == in_n_test &&
        dec == in_dec
    );

    //
    // 1. step | Check x_merkleroot
    //

    component xy_merkleproof = MerkleProof(k, n, merkle_level, hash_alg);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            xy_merkleproof.in_x_pos[j][i] <== in_x_pos[j][i];
            xy_merkleproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        xy_merkleproof.in_y_pos[i][0] <== in_y_pos[i][0];
        xy_merkleproof.in_y_sign[i][0] <== in_y_sign[i][0];
    }

    //make sure that root is correct
    in_xy_merkleroot === xy_merkleproof.out;


    //
    // 2. step | calculate b
    //

    // calculate XXX (k x n) = XX_INV (k x k) * X (k x n)
    component XXX_mult = MatrixMult(k, k, n);
    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            XXX_mult.in_a[j][i] <== in_xx_inv_pos[j][i];
            XXX_mult.in_a_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            XXX_mult.in_b[j][i] <== in_x_pos[j][i];
            XXX_mult.in_b_sign[j][i] <== in_x_sign[j][i];
        }
    }

    // calculate b (k x 1) = XXX (k x n) * y (n x 1)
    component b_mult = MatrixMult(n, k, 1);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            b_mult.in_a[j][i] <== XXX_mult.out[j][i];
            b_mult.in_a_sign[j][i] <== XXX_mult.out_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        b_mult.in_b[i][0] <== in_y_pos[i][0];
        b_mult.in_b_sign[i][0] <== in_y_sign[i][0];
    }


    //
    // 3. step | compute y_est
    //

    // compute x_trans
    signal x_test_trans_pos[n_test][k];
    signal x_test_trans_sign[n_test][k];
    for (var j = 0; j < n_test; j++) {
        for (var i = 0; i < k; i++) {
            x_test_trans_pos[j][i] <== in_x_test_pos[i][j];
            x_test_trans_sign[j][i] <== in_x_test_sign[i][j];
        }
    }

    // calculate y_est (n_test x 1) = X (n_test x k) * b (k x 1)
    component y_est_mult = MatrixMult(k, n_test, 1);
    for (var i = 0; i < n_test; i++) {
        for (var j = 0; j < k; j++) {
            y_est_mult.in_a[i][j] <== x_test_trans_pos[i][j];
            y_est_mult.in_a_sign[i][j] <== x_test_trans_sign[i][j];
        }
    }
    for (var j = 0; j < k; j++) {
        y_est_mult.in_b[j][0] <== b_mult.out[j][0];
        y_est_mult.in_b_sign[j][0] <== b_mult.out_sign[j][0];
    }


    //
    // 4. step | calculate cost
    //

    // calculate dec helper
    component dec_power = Power(4 * dec);
    dec_power.base <== 10;
    signal dec_pow <== dec_power.out;

    // calculate cost * n_test = ||(y_test - y_est)||2
    signal y_est[n_test];
    signal y_test[n_test];
    signal y_test_tmp[n_test];
    component cost_sum = SigSum(n_test);
    for (var i = 0; i < n_test; i++) {
        // make negative / positive
        y_est[i] <== y_est_mult.out[i][0] - (2 * y_est_mult.out_sign[i][0] * y_est_mult.out[i][0]);
        y_test_tmp[i] <== in_y_test_pos[i][0] - (2 * in_y_test_sign[i][0] * in_y_test_pos[i][0]);
        y_test[i] <== y_test_tmp[i] * dec_pow;

        // calculate cost
        cost_sum.in[i] <== (y_est[i] - y_test[i]) * (y_est[i] - y_test[i]);
    }


    out <== cost_sum.out;

/*
    for (var i = 0; i < n_test; i++) {
        out[i] <== y_est_mult.out[i][0];
    }
*/
}

component main = LinRegCost(5, 20, 20, 5, 7, 1);
//cf. LinRegProof(k, n, n_test, dec, merkle_level, hash_alg)