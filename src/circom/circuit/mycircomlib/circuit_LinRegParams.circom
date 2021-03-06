include "../../../circomlib/circuits/comparators.circom";
include "./mycircomlib/stats.circom";
include "./mycircomlib/matrixmult.circom";
include "./mycircomlib/matrixnorms.circom";
include "./mycircomlib/merkleproof_six.circom";
include "./mycircomlib/xx_rangeproof.circom";
include "./mycircomlib/b_rangeproof.circom";


/////////////////////////////////////////////////


template LinRegProof(k, n, dec, merkle_level_train, require_meanxn_acc, require_varxn_acc, require_XX_acc,
        require_XX_inv_maxnorm, require_X_trans_Y_maxnorm, require_b_noisy_acc, hash_alg, DP_acc) {

    signal private input in_x_pos[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_y_pos[n][1];
    signal private input in_y_sign[n][1];
    signal private input in_xx_inv_pos[k][k];
    signal private input in_xx_inv_sign[k][k];
    //public inputs:
    signal input in_k;
    signal input in_n;
    signal input in_dec;
    signal input in_merkleroot_train;
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_DP_acc;
    signal input in_hash_BC;
    signal input in_b_noisy_true_pos[k][1];
    signal input in_b_noisy_true_sign[k][1];
    signal input in_require_meanxn_acc;
    signal input in_require_varxn_acc;
    signal input in_require_XX_acc;
    signal input in_require_XX_inv_maxnorm;
    signal input in_require_X_trans_Y_maxnorm;
    signal input in_require_b_noisy_acc;


    //
    // 0. step | Prerequisites: make sure that input variables are correct
    //

    assert (
        k == in_k &&
        n == in_n &&
        dec == in_dec &&
        require_meanxn_acc == in_require_meanxn_acc &&
        require_varxn_acc == in_require_varxn_acc &&
        require_XX_acc == in_require_XX_acc &&
        require_XX_inv_maxnorm == in_require_XX_inv_maxnorm &&
        require_X_trans_Y_maxnorm == in_require_X_trans_Y_maxnorm &&
        require_b_noisy_acc == in_require_b_noisy_acc &&
        DP_acc == in_DP_acc
    );


    //
    // 1. step | Check data normalization (i.e., mean = 0 and var = 1)
    //

    //check mean
    component check_mean = Check_MeanXY(k, n, dec, require_meanxn_acc);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            check_mean.in_x_pos[j][i] <== in_x_pos[j][i];
            check_mean.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        check_mean.in_y_pos[i][0] <== in_y_pos[i][0];
        check_mean.in_y_sign[i][0] <== in_y_sign[i][0];
    }
    //make sure that output >= require_meanxn_acc
    var bits_range_meanxn_acc = 0;
    while ( (2**bits_range_meanxn_acc + 3) < dec) {
        bits_range_meanxn_acc++;
    }
    component range_meanxn_acc = GreaterEqThan(bits_range_meanxn_acc);
    range_meanxn_acc.in[0] <== check_mean.out;
    range_meanxn_acc.in[1] <== in_require_meanxn_acc;
    1 === range_meanxn_acc.out;

    //check var
    //calculate dec_adjusted
    var dec_adjusted = 2*dec;
    while (10**dec_adjusted < n * 10**(2*dec)) {
        dec_adjusted++;
    }
    dec_adjusted--;
    component check_var = Check_VarXY(k, n, dec, dec_adjusted, require_varxn_acc);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            check_var.in_x_pos[j][i] <== in_x_pos[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        check_var.in_y_pos[i][0] <== in_y_pos[i][0];
    }
    check_var.in_n <== in_n;
    //make sure that output >= require_varxn_acc
    var bits_range_varxn_acc = 0;
    while ( (2**bits_range_varxn_acc + 3) < dec_adjusted) {
        bits_range_varxn_acc++;
    }
    component range_varxn_acc = GreaterEqThan(bits_range_varxn_acc);
    range_varxn_acc.in[0] <== check_var.out;
    range_varxn_acc.in[1] <== in_require_varxn_acc;
    1 === range_varxn_acc.out;


    //
    // 2. step | Check xy_merkleroot
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
    // 3. step | XX range proof
    //

    //XX range proof
    component XX_rangeproof = XX_RangeProof(k, n, require_XX_acc, dec);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            XX_rangeproof.in_x_pos[j][i] <== in_x_pos[j][i];
            XX_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            XX_rangeproof.in_xx_inv_pos[j][i] <== in_xx_inv_pos[j][i];
            XX_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }

    //make sure that output >= require_XX_acc
    var bits_range_XX_acc = 0;
    while ( (2**bits_range_XX_acc + 3) < 3*dec) {
        bits_range_XX_acc++;
    }
    component range_XX_acc = GreaterEqThan(bits_range_XX_acc);
    range_XX_acc.in[0] <== XX_rangeproof.check_XX_minacc;
    range_XX_acc.in[1] <== in_require_XX_acc;
    1 === range_XX_acc.out;


    //
    // 4. step | range proof max element matrix norm for XX_inv
    //

    //get max element
    var bits_maxelement_XX_inv_pos = 0;
    while ( (2**bits_maxelement_XX_inv_pos + 2) < require_XX_inv_maxnorm ) {
        bits_maxelement_XX_inv_pos++;
    }
    component maxelement_XX_inv_pos = NormMaxElement(k, k, bits_maxelement_XX_inv_pos);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            maxelement_XX_inv_pos.in[j][i] <== in_xx_inv_pos[j][i];
        }
    }

    //check range
    var bits_range_XX_inv_norm = 0;
    while ( (2**bits_range_XX_inv_norm + 2) < require_XX_inv_maxnorm ) {
        bits_range_XX_inv_norm++;
    }
    component range_XX_inv_norm = LessEqThan(bits_range_XX_inv_norm);
    range_XX_inv_norm.in[0] <== in_k * maxelement_XX_inv_pos.out;
    range_XX_inv_norm.in[1] <== in_require_XX_inv_maxnorm;

    //make sure that in_k * maxelement_XX_inv_pos.out <= in_require_XX_inv_maxnorm;
    1 === range_XX_inv_norm.out;


    //
    // 5. step | range proof max element matrix norm for X_trans_Y
    //

    // compute X_trans_Y (k x 1) = X (k x n) * Y (n x 1)
    component X_trans_Y_mult = MatrixMult(n, k, 1);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            X_trans_Y_mult.in_a_pos[j][i] <== in_x_pos[j][i];
            X_trans_Y_mult.in_a_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        X_trans_Y_mult.in_b_pos[i][0] <== in_y_pos[i][0];
        X_trans_Y_mult.in_b_sign[i][0] <== in_y_sign[i][0];
    }

    //get max element
    var bits_range_X_trans_Y_norm = 0;
    while ( (2**bits_range_X_trans_Y_norm + 2) < require_X_trans_Y_maxnorm ) {
        bits_range_X_trans_Y_norm++;
    }
    component maxelement_X_trans_Y_pos = VectorNormMaxElement(k, bits_range_X_trans_Y_norm);
    for (var j = 0; j < k; j++) {
        maxelement_X_trans_Y_pos.in[j] <== X_trans_Y_mult.out_pos[j][0];
    }

    //check range
    var bits_maxelement_X_trans_Y_pos = 0;
    while ( (2**bits_maxelement_X_trans_Y_pos + 2) < require_X_trans_Y_maxnorm ) {
        bits_maxelement_X_trans_Y_pos++;
    }
    component range_X_trans_Y_norm = LessEqThan(bits_maxelement_X_trans_Y_pos);
    range_X_trans_Y_norm.in[0] <== in_k * maxelement_X_trans_Y_pos.out;
    range_X_trans_Y_norm.in[1] <== in_require_X_trans_Y_maxnorm;

    //make sure that in_k * maxelement_X_trans_Y_pos.out <= in_require_X_trans_Y_maxnorm;
    1 === range_X_trans_Y_norm.out;


    //
    // 6. step | b range proof
    //

    component b_noisy_rangeproof = b_noisy_RangeProof(k, n, require_b_noisy_acc, hash_alg, dec, DP_acc);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            b_noisy_rangeproof.in_x_pos[j][i] <== in_x_pos[j][i];
            b_noisy_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            b_noisy_rangeproof.in_xx_inv_pos[j][i] <== in_xx_inv_pos[j][i];
            b_noisy_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        b_noisy_rangeproof.in_y_pos[i][0] <== in_y_pos[i][0];
        b_noisy_rangeproof.in_y_sign[i][0] <== in_y_sign[i][0];
    }
    for (var i = 0; i < (DP_acc - 1); i++) {
        b_noisy_rangeproof.in_Lap_X_pos[i] <== in_Lap_X_pos[i];
    }
    b_noisy_rangeproof.in_hash_BC <== in_hash_BC;
    b_noisy_rangeproof.in_DP_acc <== in_DP_acc;
    for (var j = 0; j < k; j++) {
        b_noisy_rangeproof.in_b_noisy_true_pos[j][0] <== in_b_noisy_true_pos[j][0];
        b_noisy_rangeproof.in_b_noisy_true_sign[j][0] <== in_b_noisy_true_sign[j][0];
    }

    //check output
    var bits_range_b_noisy_acc = 0;
    while ( (2**bits_range_b_noisy_acc + 3) < 3*dec) {
        bits_range_b_noisy_acc++;
    }
    component range_b_noisy_acc = GreaterEqThan(require_b_noisy_acc);
    range_b_noisy_acc.in[0] <== b_noisy_rangeproof.check_b_noisy_minacc;
    range_b_noisy_acc.in[1] <== in_require_b_noisy_acc;
    1 === range_b_noisy_acc.out;
}

component main = LinRegProof(5, 20, 5, 6, 3, 3, 2,
    100000, 50000000000000, 3, 1, 100);
//cf. LinRegProof(k, n, dec, merkle_level_train, require_meanxn_acc, require_varxn_acc, require_XX_acc,
//    require_XX_inv_maxnorm, require_X_trans_Y_maxnorm, require_b_noisy_acc, hash_alg, DP_acc) {

// time /bin/bash /home/timmel/WebstormProjects/ma_webstorm_v4/src/circom/circuit/snark_generate-zkey.sh
// time /bin/bash /home/timmel/WebstormProjects/ma_webstorm_v4/src/circom/circuit/snark_prove-validate.sh

// time /bin/bash /home/timmel/WebstormProjects/ma_webstorm_v4/src/circom/circuit/c-compiler/snark_generate-zkey_cpp.sh
// time /bin/bash /home/timmel/WebstormProjects/ma_webstorm_v4/src/circom/circuit/c-compiler/snark_prove-validate_cpp.sh