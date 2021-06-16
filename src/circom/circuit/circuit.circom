include "./mycircomlib/matrixmult.circom";
include "./mycircomlib/merkleproof_six.circom";
include "./mycircomlib/b_rangeproof.circom";
include "./mycircomlib/power.circom";


/////////////////////////////////////////////////


template LinRegCost(k, n, n_test, dec, merkle_level_train, merkle_level_test, hash_alg, require_b_acc) {
    signal private input in_x_pos[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_y_pos[n][1];
    signal private input in_y_sign[n][1];
    signal private input in_b_true_pos[k][1];
    signal private input in_b_true_sign[k][1];
    signal private input in_xx_inv_pos[k][k];
    signal private input in_xx_inv_sign[k][k];
    //public inputs:
    signal private input in_x_test_pos[k][n_test];
    signal private input in_x_test_sign[k][n_test];
    signal private input in_y_test_pos[n_test][1];
    signal private input in_y_test_sign[n_test][1];
    signal input in_cost_submitted;
    signal input in_k;
    signal input in_n;
    signal input in_n_test;
    signal input in_dec;
    signal input in_merkleroot_train;
    signal input in_merkleroot_test;
    signal input in_require_b_acc;


    //
    // 0. step | Prerequisites: make sure that input variables are correct
    //

    assert (
        k == in_k &&
        n == in_n &&
        n_test == in_n_test &&
        dec == in_dec &&
        require_b_acc == in_require_b_acc
    );

    //
    // 1. step | Check in_merkleroot_train
    //

    component merkleproof_train = MerkleProof_six(k, n, merkle_level_train, hash_alg);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            merkleproof_train.in_x_pos[j][i] <== in_x_pos[j][i];
            merkleproof_train.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        merkleproof_train.in_y_pos[i][0] <== in_y_pos[i][0];
        merkleproof_train.in_y_sign[i][0] <== in_y_sign[i][0];
    }

    //make sure that root is correct
    in_merkleroot_train === merkleproof_train.out;


    //
    // 2. step | Check in_merkleroot_test
    //

    component merkleproof_test = MerkleProof_six(k, n_test, merkle_level_test, hash_alg);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n_test; i++) {
            merkleproof_test.in_x_pos[j][i] <== in_x_test_pos[j][i];
            merkleproof_test.in_x_sign[j][i] <== in_x_test_sign[j][i];
        }
    }
    for (var i = 0; i < n_test; i++) {
        merkleproof_test.in_y_pos[i][0] <== in_y_test_pos[i][0];
        merkleproof_test.in_y_sign[i][0] <== in_y_test_sign[i][0];
    }

    //make sure that root is correct
    in_merkleroot_test === merkleproof_test.out;


    //
    // 3. step | range proof b
    //

    component b_rangeproof = b_RangeProof(k, n, require_b_acc, hash_alg, dec);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            b_rangeproof.in_x_pos[j][i] <== in_x_pos[j][i];
            b_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        b_rangeproof.in_y_pos[i][0] <== in_y_pos[i][0];
        b_rangeproof.in_y_sign[i][0] <== in_y_sign[i][0];
    }
    for (var j = 0; j < k; j++) {
        b_rangeproof.in_b_true_pos[j][0] <== in_b_true_pos[j][0];
        b_rangeproof.in_b_true_sign[j][0] <== in_b_true_sign[j][0];
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            b_rangeproof.in_xx_inv_pos[j][i] <== in_xx_inv_pos[j][i];
            b_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }

    //check output
    var bits_range_b_acc = 0;
    while ( (2**bits_range_b_acc + 3) < require_b_acc) {
        bits_range_b_acc++;
    }
    component range_b_acc = GreaterEqThan(bits_range_b_acc);
    range_b_acc.in[0] <== b_rangeproof.check_b_minacc;
    range_b_acc.in[1] <== in_require_b_acc;
    1 === range_b_acc.out;


    //
    // 4. step | compute y_est
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
            y_est_mult.in_a_pos[i][j] <== x_test_trans_pos[i][j];
            y_est_mult.in_a_sign[i][j] <== x_test_trans_sign[i][j];
        }
    }
    for (var j = 0; j < k; j++) {
        y_est_mult.in_b_pos[j][0] <== in_b_true_pos[j][0];
        y_est_mult.in_b_sign[j][0] <== in_b_true_sign[j][0];
    }


    //
    // 5. step | calculate cost
    //

    // calculate dec helper
    component dec_power_y_test = Power(dec);
    dec_power_y_test.base <== 10;

    // calculate cost * n_test = ||(y_test - y_est)||2
    signal y_est[n_test];
    signal y_test[n_test];
    signal y_test_tmp[n_test];
    component cost_sum = SigSum(n_test);
    for (var i = 0; i < n_test; i++) {
        // make negative / positive
        y_est[i] <== y_est_mult.out_pos[i][0] - (2 * y_est_mult.out_sign[i][0] * y_est_mult.out_pos[i][0]);
        y_test_tmp[i] <== in_y_test_pos[i][0] - (2 * in_y_test_sign[i][0] * in_y_test_pos[i][0]);
        y_test[i] <== y_test_tmp[i] * dec_power_y_test.out;

        // calculate cost
        cost_sum.in[i] <== (y_est[i] - y_test[i]) * (y_est[i] - y_test[i]);
    }

    //make sure that submitted cost is correct
    in_cost_submitted === cost_sum.out;
}

component main = LinRegCost(5, 20, 10, 5, 6, 5, 1, 3);
//cf. LinRegCost(k, n, n_test, dec, merkle_level_train, merkle_level_test, hash_alg, require_b_acc)