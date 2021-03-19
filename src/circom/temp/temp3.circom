include "./node_modules/circomlib/circuits/mimcsponge.circom";
include "./node_modules/circomlib/circuits/mimc.circom";
include "./node_modules/circomlib/circuits/poseidon.circom";

//MiMC7: 36528 constraints at k = 4, n = 20
//Poseidon: 21128 constraints at k = 4, n = 20

template MerkleProof(k, n, level) {
    signal private input in_x[k][n];
    signal private input in_x_sign[k][n];
    signal private input in_y[n][1];
    signal private input in_y_sign[n][1];
    signal private input root;
    signal output out[2**level];


    //
    // 1. step: generate row vector containing all values of x_in
    //

    var tmp_leaf = 0;
    var leafs = 2**level;
    signal data_leaf[leafs];
    signal tmp_y_sign[n];
    for (var i = 0; i < n; i++) {
        tmp_y_sign[i] <== in_y_sign[i][0] * in_y[i][0];
        data_leaf[tmp_leaf] <== in_y[i][0] - 2 * tmp_y_sign[i];
        tmp_leaf++;
    }
    signal tmp_x_sign[k][n];
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            tmp_x_sign[j][i] <== in_x_sign[j][i] * in_x[j][i];
            data_leaf[tmp_leaf] <== in_x[j][i] - 2 * tmp_x_sign[j][i];
            tmp_leaf++;
        }
    }
    for (var i = tmp_leaf; i < leafs; i++) {
        data_leaf[i] <== 0;
    }

    //
    // 2. step | Hash data_leaf
    //

    component hash[leafs] = Poseidon(1);
    for (var i = 0; i < leafs; i++) {
        //hash[i].x_in <== data_leaf[i];
        //hash[i].k <== 0;
        hash[i].inputs[0] <== data_leaf[i];
        out[i] <== hash[i].out;
    }

}

component main = MerkleProof(4, 20, 7);