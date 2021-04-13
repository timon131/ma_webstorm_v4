const build_merkle = require ("./build_merkle.js");
const params = require ("./params.js");
const data_prep = require ("./data_prep.js");
const DP_noise = require ("./DP_noise.js");
const cost = require ("./cost.js");
const fs = require ("fs");

////////////////////////////////
generate_ZKPinputs(2);
async function generate_ZKPinputs(l) {
    // l: clientID

    //
    // set parameters
    //

    // define csv path
    const csvFilePath = '/media/sf_97_VM-share/02_Data/housing.csv';

    // define number of features k and sample size n
    let k = 3;
    k++;    //account for X: k+1 x n
    const n = 30;
    //const n_test = Math.round(n / 2);
    const n_test = 10;

    // define accuracy dec (10**dec)
    const dec = 5;

    //set hashing algorithm | 0: MiMC, 1: Poseidon
    const hash_alg = 1;

    //set DP noise parameters
    const delta = 1000000;    //define when magnitude of each b value (do not reduce bs!) is known: delta = b[i]_max - b[i]_min
    const epsilon = 1;  // delta / epsilon = lambda
    const DP_acc = 100;  //must be some power of 10
    const DP_hash_BC = BigInt("17758051187679994451203721828730993341951654331694709087352450464095838859238");

    //set accuracies for range proofs
    const require_XX_acc = 3;
    const require_XX_inv_maxnorm = 10 ** (dec);
    const require_X_trans_Y_maxnorm = k * 10 ** ((2*dec) + 2);
    const require_b_noisy_acc = 3;

    //print sizes of input_public.json
    console.log("size of beta_input_public.json:");
    console.log(1 + 1 + 1 + 1 + DP_acc - 1 + 1 + 1 + k + k + 1 + 1 + 1 + 1);
    console.log("size of cost_input_public.json:");
    console.log(8);


    //
    // execute
    //

    //get input data x and y
    const data = await data_prep.prepare_housing(csvFilePath, k, n, l);
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

    //get test data x and y
    const data_test = await data_prep.prepare_housing_test(csvFilePath, k, n_test);
    const data_test_round = params.prepare_data_test(data_test[0], data_test[1], k, n_test, dec);
    const x_test_round_pos = data_test_round[0];
    const x_test_round_sign = data_test_round[1];
    const y_test_round_pos = data_test_round[2];
    const y_test_round_sign = data_test_round[3];


    //generate LinReg params
    const get_params = params.calculate_params(x, y, k, n, dec);

    const x_round_pos = get_params[0];
    const x_round_sign = get_params[1];

    const y_round_pos = get_params[2];
    const y_round_sign = get_params[3];

    const xx_inv_round_pos = get_params[4];
    const xx_inv_round_sign = get_params[5];

    const b_round_pos = get_params[6];
    const b_round_sign = get_params[7];


    //build merkle trees
    const xy_tree = build_merkle.build_merkletree(x_round_pos, x_round_sign, y_round_pos, y_round_sign, hash_alg);
    console.log("level xy: ", xy_tree.level);

    const test_tree = build_merkle.build_merkletree(x_test_round_pos, x_test_round_sign, y_test_round_pos, y_test_round_sign, hash_alg);
    console.log("level test: ", test_tree.level);

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

    //get Lap_X
    const P_tmp = [];
    for (let i = 1; i < DP_acc; i++) {
        P_tmp[i - 1] = i;
    }
    const Lap_X = DP_noise.calc_RandVar_round(delta, epsilon, P_tmp, DP_acc);

    let Lap_X_signify = signify(Lap_X);
    const Lap_X_pos = Lap_X_signify[0];
    //const Lap_X_sign = Lap_X_signify[1];

    //get cost
    const _cost = cost.calcCost(b_round_pos, b_round_sign, x_test_round_pos, x_test_round_sign, y_test_round_pos, y_test_round_sign, dec);

    //
    // LinRegParams proof: write to file
    //

    let file_params = fs.createWriteStream('LinRegParams_input_private.json');
    file_params.on('error', function (err) { /* error handling */});
    file_params.write("{\n");

    //private inputs

    //write X_ROUND_POS
    file_params.write("  \"in_x_pos\":\n    [\n");
    for (var j = 0; j < x_round_pos.length; j++) {
        if (j != k - 1) {
            file_params.write("      [" + x_round_pos[j] + "],\n");
        } else {
            file_params.write("      [" + x_round_pos[j] + "]\n");
        }
    }
    file_params.write("    ],\n");
    //write X_ROUND_SIGN
    file_params.write("  \"in_x_sign\":\n    [\n");
    for (var j = 0; j < x_round_sign.length; j++) {
        if (j != k - 1) {
            file_params.write("      [" + x_round_sign[j] + "],\n");
        } else {
            file_params.write("      [" + x_round_sign[j] + "]\n");
        }
    }
    file_params.write("    ],\n");

    //write y_ROUND_POS
    file_params.write("  \"in_y_pos\": [ ");
    for (var j = 0; j < y_round_pos.length; j++) {
        if (j != y_round_pos.length - 1) {
            file_params.write("[" + y_round_pos[j] + "],");
        } else {
            file_params.write("[" + y_round_pos[j] + "]");
        }
    }
    file_params.write("  ],\n");
    //write y_ROUND_SIGN
    file_params.write("  \"in_y_sign\": [ ");
    for (var j = 0; j < y_round_sign.length; j++) {
        if (j != y_round_sign.length - 1) {
            file_params.write("[" + y_round_sign[j] + "],");
        } else {
            file_params.write("[" + y_round_sign[j] + "]");
        }
    }
    file_params.write(" ],\n");

    //write XX_INV_ROUND_POS
    file_params.write("  \"in_xx_inv_pos\":\n    [\n");
    for (var j = 0; j < xx_inv_round_pos.length; j++) {
        if (j != k - 1) {
            file_params.write("      [" + xx_inv_round_pos[j] + "],\n");
        } else {
            file_params.write("      [" + xx_inv_round_pos[j] + "]\n");
        }
    }
    file_params.write("    ],\n");
    //write XX_INV_ROUND_SIGN
    file_params.write("  \"in_xx_inv_sign\":\n    [\n");
    for (var j = 0; j < xx_inv_round_sign.length; j++) {
        if (j != k - 1) {
            file_params.write("      [" + xx_inv_round_sign[j] + "],\n");
        } else {
            file_params.write("      [" + xx_inv_round_sign[j] + "]\n");
        }
    }
    file_params.write("    ],\n");

    //public inputs

    //write k
    file_params.write("  \"in_k\": " + k + ",\n");

    //write n
    file_params.write("  \"in_n\": " + n + ",\n");

    //write dec
    file_params.write("  \"in_dec\": " + dec + ",\n");

    //write merkle root
    file_params.write("  \"in_xy_merkleroot\": \"" + xy_tree.root + "\",\n");

    //write Lap_X_pos
    file_params.write("  \"in_Lap_X_pos\": [");
    for (let j = 0; j < Lap_X_pos.length; j++) {
        if (j != Lap_X_pos.length - 1) {
            file_params.write(Lap_X_pos[j] + ",");
        } else {
            file_params.write(Lap_X_pos[j] + "],\n");
        }
    }

    //write in_DP_sig_acc
    file_params.write("  \"in_DP_acc\": " + DP_acc + ",\n");

    //write in_hash_BC
    file_params.write("  \"in_hash_BC\": \"" + DP_hash_BC + "\",\n");

    //write b_NOISY_POS
    file_params.write("  \"in_b_noisy_true_pos\": [ ");
    for (var j = 0; j < b_noisy_pos.length; j++) {
        if (j != b_noisy_pos.length - 1) {
            file_params.write("[\"" + BigInt(b_noisy_pos[j]) + "\"],");
        } else {
            file_params.write("[\"" + BigInt(b_noisy_pos[j]) + "\"]");
        }
    }
    file_params.write(" ],\n");
    //write b_NOISY_SIGN
    file_params.write("  \"in_b_noisy_true_sign\": [ ");
    for (var j = 0; j < b_noisy_sign.length; j++) {
        if (j != b_noisy_sign.length - 1) {
            file_params.write("[" + b_noisy_sign[j] + "],");
        } else {
            file_params.write("[" + b_noisy_sign[j] + "]");
        }
    }
    file_params.write(" ],\n");

    //write require_XX_acc
    file_params.write("  \"in_require_XX_acc\": " + require_XX_acc + ",\n");

    //write require_XX_inv_maxnorm
    file_params.write("  \"in_require_XX_inv_maxnorm\": \"" + require_XX_inv_maxnorm + "\",\n");

    //write require_X_trans_Y_maxnorm
    file_params.write("  \"in_require_X_trans_Y_maxnorm\": \"" + require_X_trans_Y_maxnorm + "\",\n");

    //write require_b_noisy_acc
    file_params.write("  \"in_require_b_noisy_acc\": " + require_b_noisy_acc + "\n");

    file_params.write("}");
    file_params.end();


    //
    // LinRegCost proof: write to file
    //

    let file_cost = fs.createWriteStream('LinRegCost_input_private.json');
    file_cost.on('error', function (err) { /* error handling */});
    file_cost.write("{\n");

    //private inputs

    //write X_ROUND_POS
    file_cost.write("  \"in_x_pos\":\n    [\n");
    for (var j = 0; j < x_round_pos.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + x_round_pos[j] + "],\n");
        } else {
            file_cost.write("      [" + x_round_pos[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");
    //write X_ROUND_SIGN
    file_cost.write("  \"in_x_sign\":\n    [\n");
    for (var j = 0; j < x_round_sign.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + x_round_sign[j] + "],\n");
        } else {
            file_cost.write("      [" + x_round_sign[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");

    //write y_ROUND_POS
    file_cost.write("  \"in_y_pos\": [ ");
    for (var j = 0; j < y_round_pos.length; j++) {
        if (j != y_round_pos.length - 1) {
            file_cost.write("[" + y_round_pos[j] + "],");
        } else {
            file_cost.write("[" + y_round_pos[j] + "]");
        }
    }
    file_cost.write("  ],\n");
    //write y_ROUND_SIGN
    file_cost.write("  \"in_y_sign\": [ ");
    for (var j = 0; j < y_round_sign.length; j++) {
        if (j != y_round_sign.length - 1) {
            file_cost.write("[" + y_round_sign[j] + "],");
        } else {
            file_cost.write("[" + y_round_sign[j] + "]");
        }
    }
    file_cost.write(" ],\n");

    //write b_ROUND_POS
    file_cost.write("  \"in_b_true_pos\": [ ");
    for (var j = 0; j < b_round_pos.length; j++) {
        if (j != b_round_pos.length - 1) {
            file_cost.write("[" + Math.round(b_round_pos[j] / 10**(2*dec)) + "],");
        } else {
            file_cost.write("[" + Math.round(b_round_pos[j] / 10**(2*dec))+ "]");
        }
    }
    file_cost.write(" ],\n");
    //write b_ROUND_SIGN
    file_cost.write("  \"in_b_true_sign\": [ ");
    for (var j = 0; j < b_round_sign.length; j++) {
        if (j != b_round_sign.length - 1) {
            file_cost.write("[" + b_round_sign[j] + "],");
        } else {
            file_cost.write("[" + b_round_sign[j] + "]");
        }
    }
    file_cost.write(" ],\n");

    //write XX_INV_ROUND_POS
    file_cost.write("  \"in_xx_inv_pos\":\n    [\n");
    for (var j = 0; j < xx_inv_round_pos.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + xx_inv_round_pos[j] + "],\n");
        } else {
            file_cost.write("      [" + xx_inv_round_pos[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");
    //write XX_INV_ROUND_SIGN
    file_cost.write("  \"in_xx_inv_sign\":\n    [\n");
    for (var j = 0; j < xx_inv_round_sign.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + xx_inv_round_sign[j] + "],\n");
        } else {
            file_cost.write("      [" + xx_inv_round_sign[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");

    //public inputs

    //write X_TEST_ROUND_POS
    file_cost.write("  \"in_x_test_pos\":\n    [\n");
    for (var j = 0; j < x_test_round_pos.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + x_test_round_pos[j] + "],\n");
        } else {
            file_cost.write("      [" + x_test_round_pos[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");
    //write X_TEST_ROUND_SIGN
    file_cost.write("  \"in_x_test_sign\":\n    [\n");
    for (var j = 0; j < x_test_round_sign.length; j++) {
        if (j != k - 1) {
            file_cost.write("      [" + x_test_round_sign[j] + "],\n");
        } else {
            file_cost.write("      [" + x_test_round_sign[j] + "]\n");
        }
    }
    file_cost.write("    ],\n");

    //write y_TEST_ROUND_POS
    file_cost.write("  \"in_y_test_pos\": [ ");
    for (var j = 0; j < y_test_round_pos.length; j++) {
        if (j != y_test_round_pos.length - 1) {
            file_cost.write("[" + y_test_round_pos[j] + "],");
        } else {
            file_cost.write("[" + y_test_round_pos[j] + "]");
        }
    }
    file_cost.write("  ],\n");
    //write y_TEST_ROUND_SIGN
    file_cost.write("  \"in_y_test_sign\": [ ");
    for (var j = 0; j < y_test_round_sign.length; j++) {
        if (j != y_test_round_sign.length - 1) {
            file_cost.write("[" + y_test_round_sign[j] + "],");
        } else {
            file_cost.write("[" + y_test_round_sign[j] + "]");
        }
    }
    file_cost.write(" ],\n");

    //write cost_submitted
    file_cost.write("  \"in_cost_submitted\": \"" + BigInt(_cost) + "\",\n");

    //write k
    file_cost.write("  \"in_k\": " + k + ",\n");

    //write n
    file_cost.write("  \"in_n\": " + n + ",\n");

    //write n_test
    file_cost.write("  \"in_n_test\": " + n_test + ",\n");

    //write dec
    file_cost.write("  \"in_dec\": " + dec + ",\n");

    //write xy_merkleroot
    file_cost.write("  \"in_xy_merkleroot\": \"" + xy_tree.root + "\",\n");

    //write test_merkleroot
    file_cost.write("  \"in_test_merkleroot\": \"" + test_tree.root + "\",\n");

    //write require_b_acc
    file_cost.write("  \"in_require_b_acc\": " + require_b_noisy_acc + "\n");

    file_cost.write("}");
    file_cost.end();
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