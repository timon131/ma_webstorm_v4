include "../../../../circomlib/circuits/gates.circom";
include "matrixmult.circom";
include "range.circom";
include "DP_noise.circom";
include "matrixnorms.circom";
include "power.circom";


template b_noisy_RangeProof(k, n, require_b_noisy_acc, hash_alg, dec, DP_acc) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_y_pos[n][1];
    signal input in_y_sign[n][1];
    signal input in_xx_inv_pos[k][k];
    signal input in_xx_inv_sign[k][k];
    //public inputs:
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_DP_acc;
    signal input in_hash_BC;
    signal input in_b_noisy_true_pos[k][1];
    signal input in_b_noisy_true_sign[k][1];
    //outputs:
    signal output check_b_noisy_minacc;


    //
    // 1. step | multiply: XXX (k x n) = INV_X (k x k) * X (k x n)
    //

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

    //
    // 2. step | multiply: b (k x 1) = XXX (k x n) * y (n x 1)
    //

    component y_mult = MatrixMult(n, k, 1);
    //assign inputs
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            y_mult.in_a[j][i] <== XXX_mult.out[j][i];
            y_mult.in_a_sign[j][i] <== XXX_mult.out_sign[j][i];
        }
    }
    for (var i = 0; i < n; i++) {
        y_mult.in_b[i][0] <== in_y_pos[i][0];
        y_mult.in_b_sign[i][0] <== in_y_sign[i][0];
    }


    //
    // 3. step | calculate b_NOISY
    //

    component DP_noise = DP_CalculateB(k, hash_alg, DP_acc);

    //assign inputs
    for (var j = 0; j < k; j++) {
        DP_noise.in_hash_y_pos[j][0] <== in_y_pos[j][0];
        DP_noise.in_hash_y_sign[j][0] <== in_y_sign[j][0];

        DP_noise.in_b_pos[j][0] <== y_mult.out[j][0];
        DP_noise.in_b_sign[j][0] <== y_mult.out_sign[j][0];
    }
    DP_noise.in_hash_BC <== in_hash_BC;
    DP_noise.in_DP_sig_acc <== in_DP_acc;
    for (var i = 0; i < (DP_acc - 1); i++) {
        DP_noise.in_Lap_X_pos[i] <== in_Lap_X_pos[i];
    }


    //
    // 4. step | range proof b
    //

    //calculate bits
    var bits_absdiff_b_range = 0;
    while ( (2**bits_absdiff_b_range + 3) < 10**((dec * 3) + 1)) {
        bits_absdiff_b_range++;
    }

    // calculate range per element
    component b_range[k] = Range(3*dec, require_b_noisy_acc, bits_absdiff_b_range);
    signal tmp_DP_noise_out_b[k];
    signal tmp_in_b_noisy_true[k];
    for (var j = 0; j < k; j++) {
        //check sign --> changed to signify and then check, since for small betas, sign might be different even though computation is correct!
        //DP_noise.out_b_sign[j][0] === in_b_noisy_true_sign[j][0];

        //signify
        tmp_DP_noise_out_b[j] <== 2 * DP_noise.out_b_sign[j][0] * DP_noise.out_b_pos[j][0];
        tmp_in_b_noisy_true[j] <== 2 * in_b_noisy_true_sign[j][0] * in_b_noisy_true_pos[j][0];

        //calculate range
        b_range[j].actual <== DP_noise.out_b_pos[j][0] - tmp_DP_noise_out_b[j];
        b_range[j].target <== in_b_noisy_true_pos[j][0] - tmp_in_b_noisy_true[j];
    }

    // get smallest element
    var bits_b_minelement = 0;
    while ( (2**bits_b_minelement + 3) < require_b_noisy_acc ) {
        bits_b_minelement++;
    }
    component b_minelement = VectorNormMinElement(k, bits_b_minelement);
    for (var j = 0; j < k; j++) {
        b_minelement.in[j] <== b_range[j].out;
    }

    //assign output
    check_b_noisy_minacc <== b_minelement.out;
}

////////////////////////////////////////////////
//TBD: adapt to new range circuit!
template b_RangeProof(k, n, range_acc_step, hash_alg, dec) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_y_pos[n][1];
    signal input in_y_sign[n][1];
    signal input in_b_true_pos[k][1];
    signal input in_b_true_sign[k][1];
    signal input in_xx_inv_pos[k][k];
    signal input in_xx_inv_sign[k][k];
    //public inputs:
    signal input range_acc_abs;
    //outputs:
    signal output check_b_minacc;


    //
    // 1. step | multiply: XXX (k x n) = INV_X (k x k) * X (k x n)
    //

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


    //
    // 2. step | multiply: b (k x 1) = XXX (k x n) * y (n x 1)
    //

    component b_mult = MatrixMult(n, k, 1);
    //assign inputs
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
    // 3. step | range proof b
    //

    //calculate bits
    var bits = 0;
    while (2**bits < 10**((dec * 3) + 1)) {
        bits++;
    }

    //calculate dec_abs
    component dec_pow = Power(dec * 2);
    dec_pow.base <== 10;

    // calculate range per element
    component b_diff[k] = AbsDiff(bits);
    component b_range[k] = Range(range_acc_step, bits);
    for (var j = 0; j < k; j++) {
        //check sign
        b_mult.out_sign[j][0] === in_b_true_sign[j][0];

        //calculate difference
        b_diff[j].in_a <== b_mult.out[j][0];
        b_diff[j].in_b <== in_b_true_pos[j][0] * dec_pow.out;

        //calculate range
        b_range[j].truth <== b_diff[j].out;
        b_range[j].test <== range_acc_abs;
    }

    // get smallest element
    component minelement = VectorNormMinElement(k, dec);
    for (var j = 0; j < k; j++) {
        minelement.in[j] <== b_range[j].out;
    }

    //assign output
    check_b_minacc <== minelement.out;
}

//component main = b_noisy_RangeProof(5, 20, 3, 1, 5, 100);
//cf. b_noisy_RangeProof(k, n, require_b_noisy_acc, hash_alg, dec, DP_acc)

//component main = b_RangeProof(5, 20, 3, 1, 5, 100);
//cf. b_RangeProof(k, n, range_acc_step, hash_alg, dec, DP_acc)