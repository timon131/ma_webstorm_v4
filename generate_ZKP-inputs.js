const build_merkle = require ("./build_merkle.js");
const params = require ("./params.js");
const data_prep = require ("./data_prep.js");
const DP_noise = require ("./DP_noise.js");
const fs = require ("fs");

////////////////////////////////

//
// set parameters
//

// define number of features k and sample size n
const k = 4;
const n = 20;

// define accuracy dec (10**dec)
const dec = 5;

//set hashing algorithm | 0: MiMC, 1: Poseidon
const hash_alg = 1;

//set DP noise parameters
const delta = 1000000;    //define when magnitude of each b value (do not reduce bs!) is known: delta = b[i]_max - b[i]_min
const epsilon = 1;  // delta / epsilon = lambda
const p_acc = 100;  //must some power of 10
const DP_hash_BC = BigInt("17758051187679994451203721828730993341951654331694709087352450464095838859238");


//
// execute
//

//generate random input data x and y
const data = data_prep.prepare_data(k, n);
const x = data[0];
const y = data[1];
//steady input:
/*
const x =
    [
        [
            1,   0.8408328656759207,
            -0.9891144851991363,  -0.5246849861716611,
            -0.26490643281351733,   0.6806027198812299,
            0.11008047394966236,  -0.4274406281641028,
            -0.09603755634332023,  0.20071831653178474,
            0.20081163599364227,  -0.8769602629078395,
            -0.25431747126737814,  -0.5079894231481352,
            0.7874192048425701,  -0.8557906823896995,
            0.7801515856869934, -0.38763195257124083,
            -0.8531056041368426,  0.43440268487693734
        ],
        [
            1,  0.25267314445106615,
            -0.7524763267582717,  0.36118386522080725,
            -0.6831209893380821,   0.5759065607442897,
            0.26399844796629224,   0.6598721109748071,
            -0.4027239737926642, -0.06256638464712472,
            0.3040793215708202,  -0.0693780538250739,
            0.9069379215213582,   0.5694090613021807,
            -0.27742555687427073, -0.08242795050320484,
            -0.34639668962699144, -0.16382079025156004,
            0.3624384615498011,   0.9748142420825943
        ],
        [
            1,   -0.8189045735166558,
            -0.00772442381453331,    0.7203475722078156,
            -0.8238444828706171,    0.6195256654587282,
            0.735552065167715,    0.2345311785433455,
            0.30760715108778247,    0.8463134365496054,
            0.01467163388115611,  -0.31544679945915877,
            0.3949253811031763,    0.9443001469580139,
            -0.5977057282125853,    -0.897316044677019,
            0.197851336597324,   0.13995432330651103,
            -0.7909041471044733, -0.059866297523821554
        ],
        [
            1,  -0.8198219635313304,
            -0.1849905186524654,   -0.536881025860825,
            0.8427277140287035,  0.25920714279210255,
            -0.022165127234423876,   0.5571186697296198,
            0.36659181285477227,   0.8927597067307544,
            -0.8985789266189972,   -0.304733550411862,
            -0.3965849641472492, -0.26788752482707423,
            -0.8574179384986291,  -0.1127207890111912,
            -0.12191722941029015,   0.6145630621953335,
            0.31769273579624424,  -0.7254834723305548
        ]
    ];
const y =
    [
    [ 0.38857982338624275 ],
        [ 0.5592374923381755 ],
        [ 0.7812990119282959 ],
        [ -0.015170844641213765 ],
        [ -0.9643627689239713 ],
        [ 0.6219127672803821 ],
        [ -0.08987492269063035 ],
        [ -0.7535604577837249 ],
        [ 0.2503535263169603 ],
        [ -0.8804209686886186 ],
        [ 0.2525507071169859 ],
        [ 0.3064811153775946 ],
        [ -0.504004307012625 ],
        [ 0.6928771129239921 ],
        [ -0.9550027568422936 ],
        [ 0.1404668572048069 ],
        [ -0.31091911722367427 ],
        [ 0.5908777691332869 ],
        [ -0.6347275351405022 ],
        [ -0.3693769479598741 ]
    ];
*/

//generate LinReg params
const get_params = params.calculate_params(x, y, k, n, dec);

const x_round = get_params[0];
const x_round_pos = get_params[1];
const x_round_sign = get_params[2];

const y_round = get_params[3];
const y_round_pos = get_params[4];
const y_round_sign = get_params[5];

const xx_inv_round_pos = get_params[6];
const xx_inv_round_sign = get_params[7];

const b_round_pos = get_params[8];
const b_round_sign = get_params[9];

//build merkle tree
const tree = build_merkle.build_merkletree(x_round_pos, x_round_sign, y_round_pos, y_round_sign, hash_alg);

console.log("level:");
console.log(tree.level);

//get b_noisy
const b_noisy = DP_noise.get_RandVar(
    b_round_pos,
    b_round_sign,
    y_round_pos,
    y_round_sign,
    DP_hash_BC,
    p_acc,
    delta,
    epsilon,
    dec,
    hash_alg
);
const b_noisy_pos = b_noisy[0];
const b_noisy_sign = b_noisy[1];

//get random variables
const P_tmp = [];
for (let i = 1; i < p_acc; i++) {
    P_tmp[i-1] = i;
}
const Lap_X = DP_noise.calc_RandVar_round(delta, epsilon, P_tmp, p_acc);

let Lap_X_signify = signify(Lap_X);
const Lap_X_pos = Lap_X_signify[0];
const Lap_X_sign = Lap_X_signify[1];

//
// write to file
//

writetofile();

function writetofile() {
    var file = fs.createWriteStream('auto_input_private.json');
    file.on('error', function (err) { /* error handling */});
    file.write("{\n");

    //
    //private inputs
    //

    //write X_ROUND_POS
    file.write("  \"in_x_pos\":\n    [\n");
    for (var j = 0; j < x_round_pos.length; j++) {
        if (j != k - 1) {
            file.write("      [" + x_round_pos[j] + "],\n");
        } else {
            file.write("      [" + x_round_pos[j] + "]\n");
        }
    }
    file.write("    ],\n");
    //write X_ROUND_SIGN
    file.write("  \"in_x_sign\":\n    [\n");
    for (var j = 0; j < x_round_sign.length; j++) {
        if (j != k - 1) {
            file.write("      [" + x_round_sign[j] + "],\n");
        } else {
            file.write("      [" + x_round_sign[j] + "]\n");
        }
    }
    file.write("    ],\n");

    //write y_ROUND_POS
    file.write("  \"in_y_pos\": [ ");
    for (var j = 0; j < y_round_pos.length; j++) {
        if (j != y_round_pos.length - 1) {
            file.write("[" + y_round_pos[j] + "],");
        } else {
            file.write("[" + y_round_pos[j] + "]");
        }
    }
    file.write("  ],\n");
    //write y_ROUND_SIGN
    file.write("  \"in_y_sign\": [ ");
    for (var j = 0; j < y_round_sign.length; j++) {
        if (j != y_round_sign.length - 1) {
            file.write("[" + y_round_sign[j] + "],");
        } else {
            file.write("[" + y_round_sign[j] + "]");
        }
    }
    file.write(" ],\n");

    //write XX_INV_ROUND_POS
    file.write("  \"in_xx_inv_pos\":\n    [\n");
    for (var j = 0; j < xx_inv_round_pos.length; j++) {
        if (j != k - 1) {
            file.write("      [" + xx_inv_round_pos[j] + "],\n");
        } else {
            file.write("      [" + xx_inv_round_pos[j] + "]\n");
        }
    }
    file.write("    ],\n");
    //write XX_INV_ROUND_SIGN
    file.write("  \"in_xx_inv_sign\":\n    [\n");
    for (var j = 0; j < xx_inv_round_sign.length; j++) {
        if (j != k - 1) {
            file.write("      [" + xx_inv_round_sign[j] + "],\n");
        } else {
            file.write("      [" + xx_inv_round_sign[j] + "]\n");
        }
    }
    file.write("    ],\n");

    //
    //public inputs
    //

    //write merkle root
    file.write("  \"in_xy_merkleroot\": \"" + tree.root + "\",\n");

    //write Lap_X_pos
    file.write("  \"in_Lap_X_pos\": [");
    for (let j = 0; j < Lap_X_pos.length; j++) {
        if (j != Lap_X_pos.length - 1) {
            file.write(Lap_X_pos[j] + ",");
        } else {
            file.write(Lap_X_pos[j] + "],\n");
        }
    }

    //write in_DP_sig_acc
    file.write("  \"in_DP_sig_acc\": " + p_acc + ",\n");

    //write in_hash_BC
    file.write("  \"in_hash_BC\": \"" + DP_hash_BC + "\",\n");

    //write range_acc_abs
    file.write("  \"range_acc_abs\": " + 10**(3*dec) + ",\n");

    //write b_NOISY_POS
    file.write("  \"in_b_noisy_true_pos\": [ ");
    for (var j = 0; j < b_noisy_pos.length; j++) {
        if (j != b_noisy_pos.length - 1) {
            file.write("[" + b_noisy_pos[j] + "],");
        } else {
            file.write("[" + b_noisy_pos[j] + "]");
        }
    }
    file.write(" ],\n");
    //write b_NOISY_SIGN
    file.write("  \"in_b_noisy_true_sign\": [ ");
    for (var j = 0; j < b_noisy_sign.length; j++) {
        if (j != b_noisy_sign.length - 1) {
            file.write("[" + b_noisy_sign[j] + "],");
        } else {
            file.write("[" + b_noisy_sign[j] + "]");
        }
    }
    file.write(" ]\n");

    file.write("}");

    file.end();
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