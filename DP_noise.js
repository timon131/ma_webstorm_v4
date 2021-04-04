const mimcsponge = require("./circomlib/src/mimcsponge.js");
const mimc7 =  require("./circomlib/src/mimc7.js");
const poseidon =  require("./circomlib/src/poseidon.js");


function get_RandVar(b_round_pos, b_round_sign, y_round_pos, y_round_sign, DP_hash_BC, p_acc, delta, epsilon, dec, hash_alg) {

    //
    // 1. step | get y_round_field
    //

    //define prime p
    const p = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

    //transform negative y_round values to prime field representation
    let y_round_field = [];
    for (let j = 0; j < b_round_pos.length; j++) {
        y_round_field[j] = [];
        // if negative: p - y_round_pos[j][0]
        if (y_round_sign[j][0] == 1) {
            y_round_field[j][0] = p - BigInt(y_round_pos[j][0]);
        } else {
            y_round_field[j][0] = y_round_pos[j][0];
        }
    }

    //
    // 2. step | hash DP_hash_Y & DP_hash_BC
    //

    console.assert(b_round_pos.length <= y_round_pos.length, 'make sure: n >= k');

    let pos_tmp = [];
    let hash = [];
    for (let j = 0; j < y_round_field.length; j++) {
        //MiMC
        if (hash_alg == 0) {
            hash.push(mimcsponge.multiHash([y_round_field[j][0], DP_hash_BC]));
        }
        //Poseidon
        else if (hash_alg == 1) {
            pos_tmp = [y_round_field[j][0], DP_hash_BC];
            hash.push(poseidon(pos_tmp));
        }
    }

    //
    // 3. step | get P
    //

    //calculate P
    let P = [];
    for (let j = 0; j < hash.length; j++) {
        P.push(Number(hash[j] % BigInt(p_acc)));
    }

    //make sure that P != 0 and P != 100% (that's already ensured since always P != p_acc)
    for (let i = 0; i < P.length; i++) {
        if (P[i] == 0) {
            P[i] = 1;
        }
    }

    //
    // 4. step | add noise to b_round
    //

    //get random variable
    let RandVar = calc_RandVar_round(delta, epsilon, P, p_acc, dec);

    //add noise to b_round
    let b_round_noise = [];
    for (let j = 0; j < b_round_pos.length; j++) {
        //make positive / negative
        b_round_noise[j] = b_round_pos[j] - 2 * b_round_pos[j] * b_round_sign[j];
        //add noise
        b_round_noise[j] += RandVar[j];
    }

    //signify b_round_noise
    let b_round_noise_signify = signify(b_round_noise);
    let b_round_noise_pos = b_round_noise_signify[0];
    let b_round_noise_sign = b_round_noise_signify[1];


    return [b_round_noise_pos, b_round_noise_sign];
}

function calc_RandVar_round(delta, epsilon, P, p_acc) {

    //calculate lambda
    let lambda = delta / epsilon;

    //calculate Laplacian random variable
    let Lap_X = [];
    let P_rel = [];
    for (let j = 0; j < P.length; j++) {
        P_rel[j] = P[j] / p_acc;
        if (P_rel[j] < 0.5) {
            //mean must always be zero!
            Lap_X[j] = lambda * Math.log(2 * P_rel[j]);
        } else {
            Lap_X[j] = -(lambda * Math.log(2 * (1 - P_rel[j])));
        }
    }

    //round Lap_X: Lap_X_ROUND
    let Lap_X_round = [];
    for (let j = 0; j < Lap_X.length; j++) {
        Lap_X_round[j] = Math.round(Lap_X[j]);  //Lap_X_round is not scaled to 10**(3*dec) since delta already considers b's scale!
    }

    return Lap_X_round;
}

function signify(x) {
    let k = x.length;

    let x_pos = [];
    let x_sign = [];
    for (let j = 0; j < k; j++) {
        if (x[j] < 0) {
            x_pos[j] = -x[j];
            x_sign[j] = 1;
        } else {
            x_pos[j] = x[j];
            x_sign[j] = 0;
        }
    }
    return [x_pos, x_sign];
}


module.exports = {
    //functions:
    get_RandVar,
    calc_RandVar_round
    //values:
};