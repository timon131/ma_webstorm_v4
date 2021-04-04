include "../../../circomlib/circuits/gates.circom";
include "./mycircomlib/matrixmult.circom";
include "./mycircomlib/range.circom";
include "./mycircomlib/abs_diff.circom";
include "./mycircomlib/DP_noise.circom";
include "./mycircomlib/matrixnorms.circom";


include "./mycircomlib/merkleproof.circom";
include "./mycircomlib/xx_rangeproof.circom";
include "./mycircomlib/b_rangeproof.circom";
include "./mycircomlib/matrixnorms.circom";
include "./mycircomlib/power.circom";
include "../../../circomlib/circuits/comparators.circom";

//k = 4, n = 20, range_acc = 10
//MiMC7: ~41000 constraints
//Poseidon: XX constraints | generate-zkey: XX | prove-validate: XX

//k = 4, n = 50, range_acc = 4
//MiMC7: XX constraints
//Poseidon: 76730 constraints | generate-zkey: XX | prove-validate: XX

/////////////////////////////////////////////////


template LinRegProof(k, n, dec, merkle_level, require_XX_acc, require_b_noisy_acc, hash_alg, DP_acc) {
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
    signal input in_xy_merkleroot;
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_DP_acc;
    signal input in_hash_BC;
    signal input in_b_noisy_true_pos[k][1];
    signal input in_b_noisy_true_sign[k][1];
    signal input in_require_XX_acc;
    signal input in_require_XX_inv_maxnorm;
    signal input in_require_b_noisy_acc;

    //
    // 0. step | Prerequisites: make sure that input variables are correct
    //

    assert (
        k == in_k &&
        n == in_n &&
        dec == in_dec &&
        require_XX_acc == in_require_XX_acc &&
        require_b_noisy_acc == in_require_b_noisy_acc &&
        DP_acc == in_DP_acc
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
    // 2. step | XX range proof
    //

    //calculate range_acc_abs
    component power = Power(dec*3);
    power.base <== 10;
    signal range_acc_abs <== power.out;

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
    XX_rangeproof.range_acc_abs <== range_acc_abs;

    //check output
    var bits_range_XX_acc = 0;
    while (2**bits_range_XX_acc < require_XX_acc) {
        bits_range_XX_acc++;
    }
    component range_XX_acc = GreaterEqThan(bits_range_XX_acc);
    range_XX_acc.in[0] <== XX_rangeproof.check_XX_minacc;
    range_XX_acc.in[1] <== in_require_XX_acc;
    1 === range_XX_acc.out;


    //
    // 3. step | range proof max element matrix norm for XX_inv
    //

    //get max element
    component maxelement_XX_inv_pos = NormMaxElement(k, k, dec);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            maxelement_XX_inv_pos.in[j][i] <== in_xx_inv_pos[j][i];
        }
    }

    //check range
    var bits_range_XX_inv_norm = 0;
    while (2**bits_range_XX_inv_norm < 10**(2*dec)) {
        bits_range_XX_inv_norm++;
    }
    component range_XX_inv_norm = LessEqThan(bits_range_XX_inv_norm);
    range_XX_inv_norm.in[0] <== in_k * maxelement_XX_inv_pos.out;
    range_XX_inv_norm.in[1] <== in_require_XX_inv_maxnorm;

    //make sure that in_k * maxelement_XX_inv_pos.out <= in_require_XX_inv_maxnorm;
    1 === range_XX_inv_norm.out;


    //
    // 4. step | b range proof
    //

    component b_rangeproof = b_RangeProof(k, n, require_b_noisy_acc, hash_alg, dec, DP_acc);

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
    b_rangeproof.range_acc_abs <== range_acc_abs;
    for (var i = 0; i < (DP_acc - 1); i++) {
        b_rangeproof.in_Lap_X_pos[i] <== in_Lap_X_pos[i];
    }
    b_rangeproof.in_hash_BC <== in_hash_BC;
    b_rangeproof.in_DP_acc <== in_DP_acc;
    for (var j = 0; j < k; j++) {
        b_rangeproof.in_b_noisy_true_pos[j][0] <== in_b_noisy_true_pos[j][0];
        b_rangeproof.in_b_noisy_true_sign[j][0] <== in_b_noisy_true_sign[j][0];
    }

    //check output
    var bits_range_b_noisy_acc = 0;
    while (2**bits_range_b_noisy_acc < require_b_noisy_acc) {
        bits_range_b_noisy_acc++;
    }
    component range_b_noisy_acc = GreaterEqThan(require_b_noisy_acc);
    range_b_noisy_acc.in[0] <== b_rangeproof.check_b_noisy_minacc;
    range_b_noisy_acc.in[1] <== in_require_b_noisy_acc;
    1 === range_b_noisy_acc.out;
}

component main = LinRegProof(5, 20, 5, 7, 3, 3, 1, 100);
//cf. LinRegProof(k, n, dec, merkle_level, require_XX_acc, require_b_noisy_acc, hash_alg, DP_acc)