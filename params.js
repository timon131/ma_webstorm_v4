const matrixmath = require ("mathjs");

//JavaScript: any integer value with a magnitude of approximately 9 quadrillion or less -- more specifically, 9,007,199,254,740,991 -- will be represented accurately

//////////////////////////

function calculate_params (x, y, k, n, dec) {

    //console.log(x);
    //console.log(y);

    //
    // 1. step | compute LinReg
    //

    // multiply: XX (k+1 x k+1) = X (k+1 x n) * X_TRANS (n x k+1)
    var x_trans = MatrixTranspose(x);
    var xx = matrixmath.multiply(x, x_trans);

    // compute: INV_XX (k+1 x k+1)
    var xx_inv;
    xx_inv = matrixmath.inv(xx);

    // compute: b (k+1 x 1) = INV_XX (k+1 x k+1) * X (k+1 x n) * y (n x 1)
    var b = matrixmath.multiply(matrixmath.multiply(xx_inv, x), y);


    //
    // 2. step | round
    //

    //round X: X_ROUND
    var x_round = [];
    for (var j = 0; j < k; j++) {
        x_round[j] = [];
        for (var i = 0; i < n; i++) {
            x_round[j][i] = x[j][i].toFixed(dec);
            x_round[j][i] = x_round[j][i] * 10 ** dec;
            x_round[j][i] = Math.round(x_round[j][i]);
        }
    }

    //round XX_INV: XX_INV_ROUND
    var xx_inv_round = [];
    for (var j = 0; j < k; j++) {
        xx_inv_round[j] = [];
        for (var i = 0; i < k; i++) {
            xx_inv_round[j][i] = xx_inv[j][i];
            xx_inv_round[j][i] = Number(xx_inv[j][i].toFixed(dec));
            xx_inv_round[j][i] = xx_inv_round[j][i] * 10 ** dec;
            xx_inv_round[j][i] = Math.round(xx_inv_round[j][i]);
        }
    }

    //round y: y_ROUND
    var y_round = [];
    for (var j = 0; j < n; j++) {
        y_round[j] = [];
        y_round[j][0] = y[j][0].toFixed(dec);
        y_round[j][0] = y_round[j][0] * 10 ** dec;
        y_round[j][0] = Math.round(y_round[j][0]);
    }

    //round b: b_ROUND
    var b_round = [];
    for (var j = 0; j < k; j++) {
        b_round[j] = [];
        b_round[j][0] = b[j][0].toFixed(dec);
        b_round[j][0] = b_round[j][0] * 10 ** dec;
        b_round[j][0] = Math.round(b_round[j][0]);
    }

    //
    // 3. step | create positive matrices with respective sign matrix
    //

    //x_round
    var x_round_signify = signify(x_round);
    var x_round_pos = x_round_signify[0];
    var x_round_sign = x_round_signify[1];

    //xx_inv_round
    var xx_inv_round_signify = signify(xx_inv_round);
    var xx_inv_round_pos = xx_inv_round_signify[0];
    var xx_inv_round_sign = xx_inv_round_signify[1];

    //y_round
    var y_round_signify = signify(y_round);
    var y_round_pos = y_round_signify[0];
    var y_round_sign = y_round_signify[1];

    //b_round
    var b_round_signify = signify(b_round);
    var b_round_pos = [];
    for (var j = 0; j < b_round_signify[0].length; j++) {
        b_round_pos[j] = b_round_signify[0][j] * 10 ** (2 * dec);
    }
    var b_round_sign = b_round_signify[1];


    return [
        x_round,
        x_round_pos,
        x_round_sign,

        y_round,
        y_round_pos,
        y_round_sign,

        xx_inv_round_pos,
        xx_inv_round_sign,

        b_round_pos,
        b_round_sign
    ];
}

function MatrixTranspose(a) {
    var a_rows = a.length;
    var a_cols = a[0].length;

    //initialize transposed matrix a_trans
    var a_trans = [];
    for (var j = 0; j < a_cols; j++) {
        a_trans[j] = [];
    }

    //transpose matrix
    for (var j = 0; j < a_rows; j++) {
        for (var i = 0; i < a_cols; i++) {
            a_trans[i][j] = a[j][i];
        }
    }

    return a_trans;
}

function signify(x) {
    var k = x.length;
    var n = x[0].length;

    var x_pos = [];
    var x_sign = [];
    for (var j = 0; j < k; j++) {
        x_pos[j] = [];
        x_sign[j] = [];
        for (var i = 0; i < n; i++) {
            if (x[j][i] < 0) {
                x_pos[j][i] = -x[j][i];
                x_sign[j][i] = 1;
            } else {
                x_pos[j][i] = x[j][i];
                x_sign[j][i] = 0;
            }
        }
    }
    return [x_pos, x_sign];
}

/////////////////////////////////////////

module.exports = {
    //functions:
    calculate_params
}