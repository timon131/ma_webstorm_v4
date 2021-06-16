include "sigsum.circom";

// OUT(k x l) = A(k x n) * B(n x l)

/*
{
  "in_a":  [[1,1,1,1,1],[1,2,3,4,5],[1,3,2,5,4]],
  "in_a_sign":  [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
  "in_b": [[1,1,1],[1,2,3],[1,3,2],[1,4,5],[1,5,4]],
  "in_b_sign":  [[0,0,0],[0,0,0],[0,0,0],[0,0,0],[0,0,0]]
}
*/

/////////////////////////

template MatrixMult(n, k, l) {
    signal input in_a_pos[k][n];
    signal input in_a_sign[k][n];
    signal input in_b_pos[n][l];
    signal input in_b_sign[n][l];
    signal output out_pos[k][l];
    signal output out_sign[k][l];
    // sign: 0 for positive | 1 for negative

    //make both in's negative / positive
    signal tmp_in_a_pos[k][n];
    signal tmp_multi_in_a_pos[k][n];
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            tmp_multi_in_a_pos[j][i] <== 1 - 2 * in_a_sign[j][i];
            tmp_in_a_pos[j][i] <== tmp_multi_in_a_pos[j][i] * in_a_pos[j][i];
        }
    }
    signal tmp_in_b_pos[n][l];
    signal tmp_multi_in_b_pos[n][l];
    for (var i = 0; i < n; i++) {
        for (var m = 0; m < l; m++) {
            tmp_multi_in_b_pos[i][m] <== 1 - 2 * in_b_sign[i][m];
            tmp_in_b_pos[i][m] <== tmp_multi_in_b_pos[i][m] * in_b_pos[i][m];
        }
    }

    // multiply values
    signal tmp_multi_pos[k][l][n];
    signal multi_sign[k][l][n];
    for (var j = 0; j < k; j++) {
        for (var m = 0; m < l; m++) {
            for (var i = 0; i < n; i++) {
                tmp_multi_pos[j][m][i] <== tmp_in_a_pos[j][i] * tmp_in_b_pos[i][m];
            }
        }
    }
    //handle negative interim values
    signal multi_pos[k][l][n];
    for (var j = 0; j < k; j++) {
        for (var m = 0; m < l; m++) {
            for (var i = 0; i < n; i++) {
                multi_sign[j][m][i] <-- tmp_multi_pos[j][m][i] < 0;
                multi_sign[j][m][i] * (1 - multi_sign[j][m][i]) === 0;
                multi_pos[j][m][i] <== tmp_multi_pos[j][m][i] + (-2 * multi_sign[j][m][i] * tmp_multi_pos[j][m][i]);
            }
        }
    }

    // sum multiplied values to create result matrix
    component sum[k][l] = SigSumNeg(n);
    for (var j = 0; j < k; j++) {
        for (var m = 0; m < l; m++) {
            for (var i = 0; i < n; i++) {
                sum[j][m].in_pos[i] <== multi_pos[j][m][i];
                sum[j][m].in_sign[i] <== multi_sign[j][m][i];
            }
        }
    }

    //assign output values
    for (var j = 0; j < k; j++) {
        for (var m = 0; m < l; m++) {
            out_pos[j][m] <== sum[j][m].out_pos;
            out_sign[j][m] <== sum[j][m].out_sign;
        }
    }
}