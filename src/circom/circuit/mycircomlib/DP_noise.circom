include "../../../../circomlib/circuits/comparators.circom";
include "../../../../circomlib/circuits/mimcsponge.circom";
include "../../../../circomlib/circuits/poseidon.circom";
include "sigsum.circom";

/////////////////////////////////////////////

/*
{
  "in_hash": [
               "21455455627646157468819889425096445503451548743960116339658299656352689021136",
               "12512133931096990449798046942002453103752134522510230313573645726455149280690",
               "16517097154300072334393717612134162958764206165372651734094720935242411110133",
               "16364053547983670647819591243427318474970523402678363770466439012242959451919",
               "17829265254908479636114238610902303506876092751861389338423823809672124796570"
             ],
  "in_DP_acc": 100,
  "in_Rand_X": [3912023,3218876,2813411,2525729,2302585,2120264,1966113,1832581,1714798,1609438,1514128,1427116,1347074,1272966,1203973,1139434,1078810,1021651,967584,916291,867501,820981,776529,733969,693147,653926,616186,579818,544727,510826,478036,446287,415515,385662,356675,328504,301105,274437,248461,223144,198451,174353,150823,127833,105361,83382,61875,40822,20203,0,20203,40822,61875,83382,105361,127833,150823,174353,198451,223144,248461,274437,301105,328504,356675,385662,415515,446287,478036,510826,544727,579818,616186,653926,693147,733969,776529,820981,867501,916291,967584,1021651,1078810,1139434,1203973,1272966,1347074,1427116,1514128,1609438,1714798,1832581,1966113,2120264,2302585,2525729,2813411,3218876,3912023]
}
*/

//returns random variable that belongs to hash randomness
    //in_hash must be in brackets!
template DP_GetRandomVar(k, var_acc) {
    signal input in_hash[k];
    signal input in_DP_acc;
    signal input in_Rand_X[var_acc - 1];
    signal output out[k];
    signal output out_sign[k];

    //getP = last numbers of hash (e.g., last two numbers [0, 99] for in_DP_acc == 100)
    signal getP[k];
    signal tmp_getP[k];
    signal div[k];
    for (var j = 0; j < k; j++) {
        div[j] <-- in_hash[j] \ in_DP_acc;
        tmp_getP[j] <-- in_hash[j] % in_DP_acc;
        div[j] * in_DP_acc + tmp_getP[j] === in_hash[j];
    }

    //make sure that getP != 0% and getP != 100%
    //if (tmp_getP == 0) {getP = 1} else {getP = tmp_getP}
    component comp_getP[k] = IsEqual();
    for (var j = 0; j < k; j++) {
        comp_getP[j].in[0] <== 0;
        comp_getP[j].in[1] <== tmp_getP[j];
        getP[j] <== tmp_getP[j] + comp_getP[j].out;     // reason: comp_getP[j].out == 1 if tmp_getP[j] == 0
    }

    //create array that is zero for all i's where getP != P[i] and 1 for i where getP == P[i]
    //make sure that P != 0% and P != 100%
    signal P[k][var_acc - 1];
    component comp_P[k][var_acc - 1] = IsEqual();
    for (var j = 0; j < k; j++) {
        P[j][0] <== 1;
        for (var i = 1; i < (var_acc - 1); i++) {
            P[j][i] <== P[j][i - 1] + 1;
        }
        for (var i = 0; i < (var_acc - 1); i++) {
            comp_P[j][i].in[0] <== getP[j];
            comp_P[j][i].in[1] <== P[j][i];
        }
    }

    //get in_Rand_X[i] at getP == P[i]
    component sum[k] = SigSum(var_acc - 1);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < (var_acc - 1); i++) {
            sum[j].in[i] <== comp_P[j][i].out * in_Rand_X[i];
        }
        out[j] <== sum[j].out;
    }

    //calculate out_sign | negative for P < 0.5; positive for P >= 0.5
    var n = 0;
    while (2**n < var_acc) {
        n++;
    }
    component comp_sign[k] = LessThan(n);
    for (var j = 0; j < k; j++) {
        comp_sign[j].in[0] <== getP[j];
        comp_sign[j].in[1] <-- in_DP_acc \ 2;
        comp_sign[j].in[1] * 2 === in_DP_acc;
        out_sign[j] <== comp_sign[j].out;
    }
}

//component main = DP_GetRandomVar(5, 100);


////////////////////////////////////

/*
{
  "in_hash_y_pos": [ [117020],[102748],[20291],[205292],[193663] ],
  "in_hash_y_sign": [ [0],[0],[0],[0],[0] ],
  "in_hash_BC": "17758051187679994451203721828730993341951654331694709087352450464095838859238",
  "in_DP_acc": 100,
  "in_Lap_X_pos": [3912023,3218876,2813411,2525729,2302585,2120264,1966113,1832581,1714798,1609438,1514128,1427116,1347074,1272966,1203973,1139434,1078810,1021651,967584,916291,867501,820981,776529,733969,693147,653926,616186,579818,544727,510826,478036,446287,415515,385662,356675,328504,301105,274437,248461,223144,198451,174353,150823,127833,105361,83382,61875,40822,20203,0,20203,40822,61875,83382,105361,127833,150823,174353,198451,223144,248461,274437,301105,328504,356675,385662,415515,446287,478036,510826,544727,579818,616186,653926,693147,733969,776529,820981,867501,916291,967584,1021651,1078810,1139434,1203973,1272966,1347074,1427116,1514128,1609438,1714798,1832581,1966113,2120264,2302585,2525729,2813411,3218876,3912023],
  "in_b_pos": [ [0],[879000000000000],[174440000000000],[152880000000000],[9250000000000] ],
  "in_b_sign": [ [0],[0],[1],[1],[1] ]
}
*/

//calculates b_noisy
template DP_CalculateB(k, hash_alg, DP_acc) {
    signal input in_hash_y_pos[k][1];
    signal input in_hash_y_sign[k][1];
    signal input in_hash_BC;
    signal input in_DP_acc;
    signal input in_Lap_X_pos[DP_acc - 1];
    signal input in_b_pos[k][1];
    signal input in_b_sign[k][1];
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
            DP_hash[j].k <== 0;
        // Poseidon hash
        } else if (hash_alg == 1) {
            DP_hash[j] = Poseidon(2);
            tmp_y_sign[j] <== in_hash_y_sign[j][0] * in_hash_y_pos[j][0];
            DP_hash[j].inputs[0] <== in_hash_y_pos[j][0] - 2 * tmp_y_sign[j];
            DP_hash[j].inputs[1] <== in_hash_BC;
        }
    }

    //
    // 2. step | get random variables
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
    DP_get_RandVar.in_DP_acc <== in_DP_acc;
    for (var i = 0; i < (DP_acc - 1); i++) {
        DP_get_RandVar.in_Rand_X[i] <== in_Lap_X_pos[i];
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
        tmp_in_b[j] <== in_b_pos[j][0] * in_b_sign[j][0];
        in_b[j] <== in_b_pos[j][0] - 2 * tmp_in_b[j];

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

//component main = DP_CalculateB(5, 1, 100);