include "../../../circomlib/circuits/gates.circom";
include "./mycircomlib/matrixmult.circom";
include "./mycircomlib/range.circom";
include "./mycircomlib/abs_diff.circom";
include "./mycircomlib/DP_noise.circom";
include "./mycircomlib/matrixnorms.circom";


template b_RangeProof(k, n, acc_step, hash_alg, DP_acc) {
    signal private input in_x_pos[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_xx_inv_pos[k][k];
    signal private input in_xx_inv_sign[k][k];
    signal private input in_y_pos[n][1];
    signal private input in_y_sign[n][1];
    //public inputs:
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_hash_BC;
    signal input range_acc_abs;
    signal input in_DP_sig_acc;
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
    DP_noise.in_DP_sig_acc <== in_DP_sig_acc;
    for (var i = 0; i < (DP_acc - 1); i++) {
        DP_noise.in_Lap_X_pos[i] <== in_Lap_X_pos[i];
    }

    //
    // 4. step | range proof b
    //

    //calculate bits
    var bits = 0;
    while (2**bits < 10**(dec * 3)) {
        bits++;
    }

    // calculate range per element
    component b_diff[k] = AbsDiff(bits);
    component b_range[k] = Range(acc_step, bits);
    for (var j = 0; j < k; j++) {
        assert (DP_noise.out_b_sign[j][0] == in_b_noisy_true_sign[j][0]);

        //calculate difference
        b_diff[j].in_a <== DP_noise.out_b_pos[j][0];
        b_diff[j].in_b <== in_b_noisy_true_pos[j][0];

        //calculate range
        b_range[j].truth <== b_diff[j].out;
        b_range[j].test <== range_acc_abs;
    }

    // get smallest element
    component minelement = NormMinElement(k, k, dec);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            minelement.in[j][i] <== range[j][i].out;
        }
    }

    //assign output
    check_b_noisy_minacc <==
    b_range[j].out;

    //check sign
    for (var j = 0; j < k; j++) {
        in_b_noisy_true_sign[j][0] === DP_noise.out_b_sign[j][0];
    }

}

//component main = b_RangeProof(4, 20, 6, 50);