/*
{
  "in_x_pos":
  [
    [100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000,100000],
    [46852,46852,46852,46852,46852,109322,109322,109322,109322,109322,109322,109322,46852,46852,46852,46852,46852,109322,203026,203026],
    [143208,143208,13019,13019,13019,143208,143208,143208,13019,13019,13019,13019,13019,117170,117170,117170,117170,117170,117170,117170],
    [245355,192017,74673,74673,74673,218686,5334,74673,21335,74673,5334,74673,32003,5334,48004,5334,32003,74673,74673,74673],
    [163473,9281,129110,773,92298,200979,97663,35692,67641,167293,38817,79970,39859,6503,168873,82904,18328,31507,38626,128415]
  ],
  "in_x_sign":
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0,1,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    [1,1,0,0,0,1,1,0,0,0,1,0,1,1,0,1,1,0,0,0],
    [1,1,0,1,0,1,1,0,0,1,0,0,0,1,0,1,0,1,1,0]
  ],
  "in_y_pos": [ [97321],[143963],[30089],[83936],[40821],[54358],[106308],[61942],[49049],[38546],[1763],[25160],[43361],[64217],[46016],[93416],[65734],[68009],[263790],[205393]  ],
  "in_y_sign": [ [0],[0],[1],[1],[0],[1],[1],[1],[1],[0],[0],[1],[1],[1],[1],[1],[1],[1],[0],[0] ]
}
*/


include "../../../circomlib/circuits/mimcsponge.circom";
include "../../../circomlib/circuits/poseidon.circom";
include "./mycircomlib/hash_dummy.circom";
include "./mycircomlib/zero.circom";


// hash_alg | choose hash-algorithm: 0 for MiMC or 1 for Poseidon

template MerkleProof_six(k, n, level, hash_alg) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_y_pos[n][1];
    signal input in_y_sign[n][1];
    signal output out;
    signal output tmp[level][2**(level - 1)];


    //
    // 1. step | generate data_leaf (row vector) containing in_y and in_x as well as 0s to fill it until 2**level
    //

    var tmp_leaf = 0;
    var data_leafs = 2**(level - 1) * 6;
    signal data_leaf[data_leafs];
    signal tmp_y_sign[n];
    for (var i = 0; i < n; i++) {
        tmp_y_sign[i] <== in_y_sign[i][0] * in_y_pos[i][0];
        data_leaf[tmp_leaf] <== in_y_pos[i][0] - 2 * tmp_y_sign[i];
        tmp_leaf++;
    }
    // row k=1 is not being included since it's only 1s
    signal tmp_x_sign[k-1][n];
    for (var j = 1; j < k; j++) {
        for (var i = 0; i < n; i++) {
            tmp_x_sign[j-1][i] <== in_x_sign[j][i] * in_x_pos[j][i];
            data_leaf[tmp_leaf] <== in_x_pos[j][i] - 2 * tmp_x_sign[j-1][i];
            tmp_leaf++;
        }
    }

    //assign 0 to those elements, that are not y nor x (while i < 2**level)
    for (var i = tmp_leaf; i < data_leafs; i++) {
        data_leaf[i] <== 0;
    }

    //
    // 2. step | build tree
    //

    component hash_tree[level][2**(level - 1)];

    var used_data_leafs = (k-1)*n + n;
    var empty_data_leafs = data_leafs - used_data_leafs;

    var leafs = 2**(level - 1);
    var empty_leafs = empty_data_leafs \ 6;
    var used_leafs = leafs - empty_leafs;

    // hash used_leafs (6 data_leafs in each hash)
    for (var i = 0; i < used_leafs; i++) {
        // MiMC merkle tree
        if (hash_alg == 0) {
            hash_tree[0][i] = MiMCSponge(6, 220, 1);
            hash_tree[0][i].k <== 0;
            for (var i_tmp = 0; i_tmp < 6; i_tmp++) {
                hash_tree[0][i].ins[i_tmp] <== data_leaf[i*6 + i_tmp];
            }
        // Poseidon merkle tree
        } else if (hash_alg == 1) {
            hash_tree[0][i] = Poseidon(6);
            for (var i_tmp = 0; i_tmp < 6; i_tmp++) {
                hash_tree[0][i].inputs[i_tmp] <== data_leaf[i*6 + i_tmp];
            }
        }
    }
    // assign empty_leafs
    for (var i = used_leafs; i < used_leafs + empty_leafs; i++) {
        // MiMC merkle tree
        if (hash_alg == 0) {
            hash_tree[0][i] = MiMCDummy_six();
            hash_tree[0][i].in <== 1;
        // Poseidon merkle tree
        } else if (hash_alg == 1) {
            hash_tree[0][i] = PoseidonDummy_six();
            hash_tree[0][i].in <== 1;
        }
    }

    // build merkle tree, starting at level 1
    var nodes = leafs \ 2;
    var empty_nodes = empty_leafs \ 2;
    var used_nodes = nodes - empty_nodes;

    var delta;
    var end;
    for (var l = 1; l < level; l++) {
        end = 2**(level - 1 - l);
        delta = 0;
        for (var i = 0; i < end; i++) {
            // MiMC merkle tree
            if (hash_alg == 0) {
                if (i < used_nodes) {
                    hash_tree[l][i] = MiMCSponge(2, 220, 1);
                    hash_tree[l][i].ins[0] <== hash_tree[l - 1][i + delta].outs[0];
                    hash_tree[l][i].ins[1] <== hash_tree[l - 1][i + 1 + delta].outs[0];
                    hash_tree[l][i].k <== 0;
                    delta++;
                } else {
                    hash_tree[l][i] = MiMCDummy_two();
                    hash_tree[l][i].in <== 1;
                }
            // Poseidon merkle tree
            } else if (hash_alg == 1) {
                if (i < used_nodes) {
                    hash_tree[l][i] = Poseidon(2);
                    hash_tree[l][i].inputs[0] <== hash_tree[l - 1][i + delta].out;
                    hash_tree[l][i].inputs[1] <== hash_tree[l - 1][i + 1 + delta].out;
                    delta++;
                } else {
                    hash_tree[l][i] = PoseidonDummy_two();
                    hash_tree[l][i].in <== 1;
                }
            }
        }
        nodes = nodes \ 2;
        empty_nodes = empty_nodes \ 2;
        used_nodes = nodes - empty_nodes;
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

    for (var j = 0; j < level; j++) {
        for (var i = 0; i < 2**(level - 1); i++) {
            tmp[j][i] <== hash_tree[j][i].out;
        }
    }
}

component main = MerkleProof_six(5, 20, 6, 1);
//cf. MerkleProof_six(k, n, level, hash_alg)