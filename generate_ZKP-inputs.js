const build_merkle = require ("./build_merkle.js");
const params = require ("./params.js");
const data_prep = require ("./data_prep.js");
const DP_noise = require ("./DP_noise.js");
const fs = require ("fs");

////////////////////////////////
generate_ZKPinputs();
async function generate_ZKPinputs() {

    //
    // set parameters
    //

    // define csv path
    const csvFilePath = '/media/sf_97_VM-share/02_Data/housing.csv';

    // define number of features k and sample size n
    let k = 4;
    k++;    //account for X: k+1 x n
    const n = 20;

    // define accuracy dec (10**dec)
    const dec = 5;

    //set hashing algorithm | 0: MiMC, 1: Poseidon
    const hash_alg = 1;

    //set DP noise parameters
    const delta = 1000000;    //define when magnitude of each b value (do not reduce bs!) is known: delta = b[i]_max - b[i]_min
    const epsilon = 1;  // delta / epsilon = lambda
    const DP_acc = 100;  //must some power of 10
    const DP_hash_BC = BigInt("17758051187679994451203721828730993341951654331694709087352450464095838859238");

    //set accuracies for range proofs
    const require_XX_acc = 3;
    const require_XX_inv_maxnorm = 0.5 * k * 10 ** (dec);
    const require_b_noisy_acc = 3;

    //print size of input_public.json
    console.log("size of input_public.json:");
    console.log(1 + 1 + 1 + 1 + DP_acc - 1 + 1 + 1 + k + k + 1 + 1 + 1);


    //
    // execute
    //


    //generate random input data x and y
    const data = await data_prep.prepare_housing(csvFilePath, k, n);
    const x = data[0];
    const y = data[1];
    //steady input:

    /*
    const x =
        [
            [
                1, 1, 1, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1
            ],
            [
                1.933975113662088,  2.7397980776878628,
                1.1281521496374587,   0.322329185611684,
                0.322329185611684,   0.322329185611684,
                0.322329185611684,   0.322329185611684,
                -0.4834937784140906,   0.322329185611684,
                -0.4834937784140906, -0.4834937784140906,
                -0.4834937784140906, -0.4834937784140906,
                -0.4834937784140906, -0.4834937784140906,
                -1.28931674243872,   -1.28931674243872,
                -0.4834937784140906,   -1.28931674243872
            ],
            [
                3.4627931725534604,  1.2641943328357252,
                0.1648949129772484,  0.1648949129772484,
                0.1648949129772484,  0.1648949129772484,
                -0.9344045068812286, -0.9344045068812286,
                -0.9344045068812286, -0.9344045068812286,
                0.1648949129772484,  0.1648949129772484,
                0.1648949129772484, -0.9344045068812286,
                0.1648949129772484,  0.1648949129772484,
                0.1648949129772484,  0.1648949129772484,
                -0.9344045068812286, -0.9344045068812286
            ],
            [
                -1.1408712905438991, -3.9234841943095056,
                0.38956580652718453, 0.38956580652718453,
                0.38956580652718453, 0.38956580652718453,
                0.38956580652718453, 0.38956580652718453,
                -1.0017406453556188, 0.38956580652718453,
                0.38956580652718453, 0.38956580652718453,
                0.38956580652718453, 0.38956580652718453,
                0.38956580652718453, 0.11130451615062387,
                0.38956580652718453, 0.38956580652718453,
                0.11130451615062387, 0.38956580652718453
            ],
            [
                -0.9685204889172951,  3.4931305633617113,
                -0.5473934318843675, -0.6858559906703217,
                -0.4326058183830585, -0.9405410081263511,
                0.2188138882368704,  0.6270273387509007,
                0.23316233992453403,  0.9462803888014165,
                -0.020087832362729086,  0.9132789499197902,
                0.1872472945240104, -1.1005262444438006,
                0.296295527350254, -0.7963390686653316,
                -0.18939956227715996,  -0.718857429551948,
                0.006456803259448634, -0.5215662188465731
            ]
        ];
    const y =
        [
            [ 2.385260691782951 ],    [ 1.276932760040731 ],
            [ 1.201552326851037 ],    [ 1.0743478458434284 ],
            [ 1.0849482192607292 ],   [ 0.23102924953372633 ],
            [ 0.5784859337674723 ],   [ -0.10229360347695197 ],
            [ -0.27543303595953045 ], [ 0.12973679243507497 ],
            [ 0.3700119232272247 ],   [ -0.0975823264025961 ],
            [ -0.4309051794132744 ],  [ -0.6923810570400256 ],
            [ -1.0704610422570848 ],  [ -1.2966023418261667 ],
            [ -1.1493749332525456 ],  [ -1.1140403551948765 ],
            [ -1.0763501386000296 ],  [ -1.026881729319293 ]
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

    console.log('b_round_pos: \n', b_round_pos);
    console.log('b_round_sign: \n', b_round_sign);

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
        DP_acc,
        delta,
        epsilon,
        dec,
        hash_alg
    );
    const b_noisy_pos = b_noisy[0];
    const b_noisy_sign = b_noisy[1];

    //get random variables
    const P_tmp = [];
    for (let i = 1; i < DP_acc; i++) {
        P_tmp[i - 1] = i;
    }
    const Lap_X = DP_noise.calc_RandVar_round(delta, epsilon, P_tmp, DP_acc);

    let Lap_X_signify = signify(Lap_X);
    const Lap_X_pos = Lap_X_signify[0];
    const Lap_X_sign = Lap_X_signify[1];

    //
    // write to file
    //

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

    //write k
    file.write("  \"in_k\": " + k + ",\n");

    //write n
    file.write("  \"in_n\": " + n + ",\n");

    //write dec
    file.write("  \"in_dec\": " + dec + ",\n");

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
    file.write("  \"in_DP_acc\": " + DP_acc + ",\n");

    //write in_hash_BC
    file.write("  \"in_hash_BC\": \"" + DP_hash_BC + "\",\n");

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
    file.write(" ],\n");

    //write require_XX_acc
    file.write("  \"in_require_XX_acc\": " + require_XX_acc + ",\n");

    //write require_XX_inv_maxnorm
    file.write("  \"in_require_XX_inv_maxnorm\": " + require_XX_inv_maxnorm + ",\n");

    //write require_b_noisy_acc
    file.write("  \"in_require_b_noisy_acc\": " + require_b_noisy_acc + "\n");

    file.write("}");
    file.end();
}

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

    //write k
    file.write("  \"in_k\": " + k + ",\n");

    //write n
    file.write("  \"in_n\": " + n + ",\n");

    //write dec
    file.write("  \"in_dec\": " + dec + ",\n");

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
    file.write("  \"in_DP_acc\": " + DP_acc + ",\n");

    //write in_hash_BC
    file.write("  \"in_hash_BC\": \"" + DP_hash_BC + "\",\n");

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
    file.write(" ],\n");

    //write require_XX_acc
    file.write("  \"in_require_XX_acc\": " + require_XX_acc + ",\n");

    //write require_XX_inv_maxnorm
    file.write("  \"in_require_XX_inv_maxnorm\": " + require_XX_inv_maxnorm + ",\n");

    //write require_b_noisy_acc
    file.write("  \"in_require_b_noisy_acc\": " + require_b_noisy_acc + "\n");

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