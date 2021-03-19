include "DP_noise.circom";
include "./circomlib/circuits/mimcsponge.circom";
include "./circomlib/circuits/poseidon.circom";

////////////////////////////////////

/*
{
  "in_hash_y_pos": [ [29645],[69110],[1008],[99552] ],
  "in_hash_y_sign": [ [1],[0],[0],[1] ],
  "in_hash_BC": "4343698204186575808494673",
  "in_DP_sig_acc": 100,
  "in_Lap_X": [3912023,3218876,2813411,2525729,2302585,2120264,1966113,1832581,1714798,1609438,1514128,1427116,1347074,1272966,1203973,1139434,1078810,1021651,967584,916291,867501,820981,776529,733969,693147,653926,616186,579818,544727,510826,478036,446287,415515,385662,356675,328504,301105,274437,248461,223144,198451,174353,150823,127833,105361,83382,61875,40822,20203,0,20203,40822,61875,83382,105361,127833,150823,174353,198451,223144,248461,274437,301105,328504,356675,385662,415515,446287,478036,510826,544727,579818,616186,653926,693147,733969,776529,820981,867501,916291,967584,1021651,1078810,1139434,1203973,1272966,1347074,1427116,1514128,1609438,1714798,1832581,1966113,2120264,2302585,2525729,2813411,3218876,3912023],
  "in_b_pos": [ [207310000000000],[172000000000000],[314000000000000],[52500000000000] ],
  "in_b_sign": [ [1],[0],[1],[1] ],
}
*/

template DP_CalculateB(k, hash_alg, DP_acc) {
    signal private input in_hash_y_pos[k][1];
    signal private input in_hash_y_sign[k][1];
    signal private input in_hash_BC;
    signal private input in_DP_sig_acc;
    signal private input in_Lap_X[DP_acc - 1];
    signal private input in_b_pos[k][1];
    signal private input in_b_sign[k][1];
    signal output out_b_pos[k][1];
    signal output out_b_sign[k][1];

    //
    // 1. step | get hash(in_hash_y[i], in_hash_BC)
    //

    component DP_hash[k];
    signal tmp_y_sign[k];
    for (var j = 0; j < k; j++) {
        // MiMC hash
        if (hash_alg == 0) {
            DP_hash[j] = MiMCSponge(2, 220, 1);
            tmp_y_sign[j] <== in_hash_y_sign[j][0] * in_hash_y_pos[j][0];
            DP_hash[j].ins[0] <== in_hash_y_pos[j][0] - 2 * tmp_y_sign[j];
            DP_hash[j].ins[1] <== in_hash_BC;
        // Poseidon hash
        } else if (hash_alg == 1) {
            DP_hash[j] = Poseidon(2);
            tmp_y_sign[j] <== in_hash_y_sign[j][0] * in_hash_y_pos[j][0];
            DP_hash[j].inputs[0] <== in_hash_y_pos[j][0] - 2 * tmp_y_sign[j];
            DP_hash[j].inputs[1] <== in_hash_BC;
        }
    }

    //
    // 2. step | get RandVars
    //

    //assign DP_GetRandomVar inputs
    signal RandVar[k];
    component DP_get_RandVar = DP_GetRandomVar(k, DP_acc);
    for (var j = 0; j < k; j++) {
        if (hash_alg == 0) {
            // MiMC
            DP_get_RandVar.in_hash[j] <== DP_hash[j].outs[0];
        } else if (hash_alg == 1) {
            // Poseidon
            DP_get_RandVar.in_hash[j] <== DP_hash[j].out;
        }
    }
    DP_get_RandVar.sig_acc <== in_DP_sig_acc;
    for (var i = 0; i < (DP_acc - 1); i++) {
        DP_get_RandVar.in_Rand_X[i] <== in_Lap_X[i];
    }

    //
    // 3. step | calculate b_noisy
    //

    signal DP_noise[k];
    signal tmp_DP_noise[k];
    signal in_b[k];
    signal tmp_in_b[k];
    signal out_b[k];
    for (var j = 0; j < k; j++) {
        //get DP noise and make positive / negative
        tmp_DP_noise[j] <== DP_get_RandVar.out[j] * DP_get_RandVar.out_sign[j];
        DP_noise[j] <== DP_get_RandVar.out[j] - 2 * tmp_DP_noise[j];

        // make b positive / negative
        tmp_in_b[j] <== in_b_pos[j] * in_b_sign[j];
        in_b[j] <== in_b_pos[j] - 2 * tmp_in_b[j];

        //calculate out_b
        out_b[j] <== in_b[j] + DP_noise[j];
    }

    //signify out_b
    signal tmp_out_b_sign[k];
    for (var j = 0; j < k; j++) {
        out_b_sign[j][0] <-- out_b[j] < 0;
        out_b_sign[j][0] * (1 - out_b_sign[j][0]) === 0;
        tmp_out_b_sign[j] <== out_b_sign[j][0] * out_b[j];
        out_b_pos[j][0] <== out_b[j] - 2 * tmp_out_b_sign[j];
    }

}

component main = DP_CalculateB(4, 1, 100);