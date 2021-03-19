//Some specs

//k = 4, n = 20
//MiMC7: 134741 constraints
//Poseidon: 23960 constraints

//k = 4, n = 50
//MiMC7: 331571 constraints
//Poseidon: 58979 constraints

//k = 4, n = 100 (ERROR: data segments count of 108142 exceeds internal limit of 100000)
//MiMC7: XX constraints
//Poseidon: 117729 constraints


///////////////////////////////////////////////

include "../../../../circomlib/circuits/mimcsponge.circom";
include "../../../../circomlib/circuits/mimc.circom";
include "../../../../circomlib/circuits/poseidon.circom";
include "zero.circom";


// hash_alg | choose hash-algorithm: 0 for MiMC or 1 for Poseidon

template MerkleProof(k, n, level, hash_alg) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_y_pos[n][1];
    signal input in_y_sign[n][1];
    signal output out;


    //
    // 1. step | generate data_leaf (row vector) containing y_in and x_in as well as 0s to fill it until 2**level
    //

    var tmp_leaf = 0;
    var leafs = 2**level;
    signal data_leaf[leafs];
    signal tmp_y_sign[n];
    for (var i = 0; i < n; i++) {
        tmp_y_sign[i] <== in_y_sign[i][0] * in_y_pos[i][0];
        data_leaf[tmp_leaf] <== in_y_pos[i][0] - 2 * tmp_y_sign[i];
        tmp_leaf++;
    }
    signal tmp_x_sign[k][n];
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            tmp_x_sign[j][i] <== in_x_sign[j][i] * in_x_pos[j][i];
            data_leaf[tmp_leaf] <== in_x_pos[j][i] - 2 * tmp_x_sign[j][i];
            tmp_leaf++;
        }
    }
    //assign 0 to those elements, that are not y nor x (while i < 2**level)
    for (var i = tmp_leaf; i < leafs; i++) {
        data_leaf[i] <== 0;
    }


    //
    // 2. step | build merkle tree
    //

    component hash_tree[level][2**(level - 1)];
    var delta;
    var end;
    for (var l = 0; l < level; l++) {
        end = 2**(level - 1 - l);
        delta = 0;
        for (var i = 0; i < end; i++) {
            // MiMC merkle tree
            if (hash_alg == 0) {
                hash_tree[l][i] = MiMCSponge(2, 220, 1);
                if (l == 0) {
                    hash_tree[l][i].ins[0] <== data_leaf[i + delta];
                    hash_tree[l][i].ins[1] <== data_leaf[i + 1 + delta];
                    hash_tree[l][i].k <== 0;
                    delta++;
                } else {
                    hash_tree[l][i].ins[0] <== hash_tree[l - 1][i + delta].outs[0];
                    hash_tree[l][i].ins[1] <== hash_tree[l - 1][i + 1 + delta].outs[0];
                    hash_tree[l][i].k <== 0;
                    delta++;
                }
            // Poseidon merkle tree
            } else if (hash_alg == 1) {
                hash_tree[l][i] = Poseidon(2);
                if (l == 0) {
                    hash_tree[l][i].inputs[0] <== data_leaf[i + delta];
                    hash_tree[l][i].inputs[1] <== data_leaf[i + 1 + delta];
                    delta++;
                } else {
                    hash_tree[l][i].inputs[0] <== hash_tree[l - 1][i + delta].out;
                    hash_tree[l][i].inputs[1] <== hash_tree[l - 1][i + 1 + delta].out;
                    delta++;
                }
            }
        }
    }
    // assign yet unassigned elements of hash_tree (throws error if not done)
    for (var l = 0; l < level; l++) {
        end = 2**(level - 1 - l);
        for (var i = end; i < 2**(level - 1); i++) {
            hash_tree[l][i] = Zero();
            hash_tree[l][i].in <== 0;
        }
    }


    // assign output
    if (hash_alg == 0) {
        // MiMC
        out <== hash_tree[level-1][0].outs[0];
    } else if (hash_alg == 1) {
        // Poseidon
        out <== hash_tree[level-1][0].out;
    }
}

//component main = MerkleProof(4, 20, 7, 0);