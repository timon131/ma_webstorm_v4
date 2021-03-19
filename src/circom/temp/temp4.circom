include "xx_rangeproof.circom";
include "b_rangeproof.circom";
include "merkleproof.circom";


template LinRegProof(k, n, acc_step, bits, merkle_level, hash_alg) {

    //private inputs
    signal private input in_x[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_xx_inv[k][k];
    signal private input in_xx_inv_sign[k][k];
    signal private input in_y[n][1];
    signal private input in_y_sign[n][1];
    signal private input acc_abs;

    //public inputs
    signal input in_b_true[k][1];
    signal input in_b_true_sign[k][1];
    signal input root;

    //public outputs
    signal output check_root;
    signal output check_XX_val[k][k];
    signal output check_b_val[k][1];
    signal output check_b_sign[k][1];


    //
    // 1. step | XX range proof
    //





    //
    // 2. step | XX range proof
    //

    component XX_rangeproof = XX_RangeProof(k, n, acc_step, bits);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            XX_rangeproof.in_x[j][i] <== in_x[j][i];
            XX_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            XX_rangeproof.in_xx_inv[j][i] <== in_xx_inv[j][i];
            XX_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    XX_rangeproof.acc_abs <== acc_abs;

    //get outputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            check_XX_val[j][i] <== XX_rangeproof.out[j][i];
        }
    }

    //
    // 3. step | b range proof
    //

    component b_rangeproof = b_RangeProof(k, n, acc_step, bits);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            b_rangeproof.in_x[j][i] <== in_x[j][i];
            b_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            b_rangeproof.in_xx_inv[j][i] <== in_xx_inv[j][i];
            b_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        b_rangeproof.in_y[i][0] <== in_y[i][0];
        b_rangeproof.in_y_sign[i][0] <== in_y_sign[i][0];
    }
    b_rangeproof.acc_abs <== acc_abs;
    for (var j = 0; j < k; j++) {
        b_rangeproof.in_b_true[j][0] <== in_b_true[j][0];
        b_rangeproof.in_b_true_sign[j][0] <== in_b_true_sign[j][0];
    }

    //get outputs
    for (var j = 0; j < k; j++) {
        check_b_val[j][0] <== b_rangeproof.check_b_val[j][0];
        check_b_sign[j][0] <== b_rangeproof.check_b_sign[j][0];
    }
}

component main = LinRegProof(4, 20, 6, 50);