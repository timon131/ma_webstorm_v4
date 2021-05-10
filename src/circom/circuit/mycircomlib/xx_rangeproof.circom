/*
{
  "in_x_pos":
  [
    [100000,43416,250,72988,29021,73811,11122,86217,75510,43666,54656,63091,66317,98196,54679,52344,89405,27889,74504,1807],
    [100000,88242,94990,1247,61420,16613,55121,52945,76822,91117,96788,64892,1797,8080,99602,23721,56371,40346,6436,72416],
    [100000,32913,32256,77762,92975,59787,52787,57509,83476,93264,27998,16924,69882,16248,93213,74931,6305,58145,31256,14247],
    [100000,81889,25435,92305,51896,28724,83374,21683,1691,65005,27616,86352,22945,22319,32697,48867,65024,93476,84130,47584]
  ],
  "in_x_sign":
  [
    [0,1,0,1,0,0,1,1,1,0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,0,0,0,0,0,1,1,0,0,1,0,0,0,0,1],
    [0,1,1,1,0,0,1,1,1,1,1,1,0,0,1,1,1,1,1,1],
    [0,1,0,1,0,0,1,1,1,1,0,0,0,1,1,1,1,1,1,0]
  ],
  "in_xx_inv_pos":
  [
    [15533,23,2381,5154],
    [23,15487,8190,10671],
    [2381,8190,27889,20390],
    [5154,10671,20390,32613]
  ],
  "in_xx_inv_sign":
  [
    [0,1,1,1],
    [1,0,1,0],
    [1,1,0,1],
    [1,0,1,0]
  ]
}
*/

///////////////////////////////////

//k: number of features
//n: sample size
//require_XX_acc: tests accuracy until 10**-range_acc_step

///////////////////////////////////

include "range.circom";
include "multiply-xx.circom";
include "matrixnorms.circom";

template XX_RangeProof(k, n, require_XX_acc, dec) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_xx_inv_pos[k][k];
    signal input in_xx_inv_sign[k][k];
    signal output check_XX_minacc;

    //
    // 1. step | calculate XX * XX_INV
    //

    component calc_xx = Multiply_XX(k, n);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            calc_xx.in_x_pos[j][i] <== in_x_pos[j][i];
            calc_xx.in_x_sign[j][i] <== in_x_sign[j][i];
        }
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            calc_xx.in_xx_inv_pos[j][i] <== in_xx_inv_pos[j][i];
            calc_xx.in_xx_inv_sign[j][i] <== in_xx_inv_sign[j][i];
        }
    }

    //
    // 2. step | check ranges
    //

    //calculate bits | 3*dec since: X * X_trans * XX_INV
    var bits_absdiff = 0;
    assert (dec >= require_XX_acc);
    while ( (2**bits_absdiff + 3) < (10**(dec * 3) + 10**(dec - require_XX_acc)) ) {
        bits_absdiff++;
    }

    // calculate range per element
    component pow_dec = Power(3 * dec);
    pow_dec.base <== 10;
    component range[k][k] = Range(3 * dec, require_XX_acc, bits_absdiff);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            // check diagonal elements
            if (j == i) {
                calc_xx.out_sign[j][i] === 0;
                range[j][i].actual <== calc_xx.out_pos[j][i];
                range[j][i].target <== pow_dec.out;
            } else {
            //check other elements
                range[j][i].actual <== calc_xx.out_pos[j][i];
                range[j][i].target <== 0;
            }
        }
    }

    // get smallest element
    var bits_minelement = 0;
    while ( (2**bits_minelement + 3) < 3*dec ) {
        bits_minelement++;
    }
    component minelement = NormMinElement(k, k, bits_minelement);
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < k; i++) {
            minelement.in[j][i] <== range[j][i].out;
        }
    }

    //assign output
    check_XX_minacc <== minelement.out;
}

//component main = XX_RangeProof(4, 20, 3, 5);
//cf: XX_RangeProof(k, n, require_XX_acc, dec)