include "./mycircomlib/merkleproof.circom";
include "./mycircomlib/xx_rangeproof.circom";
include "./mycircomlib/b_rangeproof.circom";

//k = 4, n = 20
//MiMC7: XX constraints
//Poseidon: 33392 constraints | generate-zkey: 1m30 | prove-validate: 0m59

//k = 4, n = 50
//MiMC7: XX constraints
//Poseidon: 76541 constraints | generate-zkey: 2m43 | prove-validate: 1m49

/////////////////////////////////////////////////


template LinRegProof(k, n, dec, merkle_level, range_acc_step, hash_alg, DP_acc) {
    signal private input in_x_pos[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_y_pos[n][1];
    signal private input in_y_sign[n][1];
    signal private input in_xx_inv_pos[k][k];
    signal private input in_xx_inv_sign[k][k];
    //public inputs:
    signal input in_xy_merkleroot;
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_DP_acc;
    signal input in_hash_BC;
    signal input range_acc_abs;
    signal input in_b_noisy_true_pos[k][1];
    signal input in_b_noisy_true_sign[k][1];
    //outputs:
    signal output check_xy_merkleroot;
    signal output check_XX_val[k][k];
    signal output check_b_noisy_val[k][1];
    signal output check_b_noisy_sign[k][1];


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
    check_xy_merkleroot <-- xy_merkleproof.out;
    check_xy_merkleroot === in_xy_merkleroot;


    //
    // 2. step | XX range proof
    //

    //calculate bits
    var bits = 0;
    while (2**bits < 10**(3 * dec)) {
        bits++;
    }

    component XX_rangeproof = XX_RangeProof(k, n, range_acc_step, bits);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            XX_rangeproof.in_x[j][i] <== in_x_pos[j][i];
            XX_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            XX_rangeproof.in_xx_inv[j][i] <== in_xx_inv_pos[j][i];
            XX_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    XX_rangeproof.acc_abs <== range_acc_abs;

    //get outputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            check_XX_val[j][i] <== XX_rangeproof.out[j][i];
        }
    }

    //
    // 3. step | b range proof
    //

    component b_rangeproof = b_RangeProof(k, n, range_acc_step, bits, hash_alg, DP_acc);

    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            b_rangeproof.in_x_pos[j][i] <== in_x_pos[j][i];
            b_rangeproof.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            b_rangeproof.in_xx_inv_pos[j][i] <== in_xx_inv_pos[j][i];
            b_rangeproof.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        b_rangeproof.in_y_pos[i][0] <== in_y_pos[i][0];
        b_rangeproof.in_y_sign[i][0] <== in_y_sign[i][0];
    }
    b_rangeproof.acc_abs <== range_acc_abs;
    for (var i = 0; i < (DP_acc - 1); i++) {
        b_rangeproof.in_Lap_X_pos[i] <== in_Lap_X_pos[i];
    }
    b_rangeproof.in_hash_BC <== in_hash_BC;
    b_rangeproof.in_DP_sig_acc <== in_DP_acc;
    for (var j = 0; j < k; j++) {
        b_rangeproof.in_b_noisy_true_pos[j][0] <== in_b_noisy_true_pos[j][0];
        b_rangeproof.in_b_noisy_true_sign[j][0] <== in_b_noisy_true_sign[j][0];
    }

    //get outputs
    for (var j = 0; j < k; j++) {
        check_b_noisy_val[j][0] <== b_rangeproof.check_b_noisy_val[j][0];
        check_b_noisy_sign[j][0] <== b_rangeproof.check_b_noisy_sign[j][0];
    }
}

component main = LinRegProof(4, 20, 5, 7, 3, 1, 100);
//compare: template LinRegProof(k, n, dec, merkle_level, range_acc_step, hash_alg, DP_acc)