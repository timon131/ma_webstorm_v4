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

//////////////////////////////////////////////////

include "sigsum.circom";
include "range.circom";
include "matrixnorms.circom";
include "power.circom";

//template checks the deviation of the sum of all values (= mean x n), not their mean! Set require_meanxn_acc dependent on n! Nevertheless, require_meanxn_acc=3 turned out to be good up to n=500
template Check_MeanXY(k, n, dec, require_meanxn_acc) {
    signal input in_x_pos[k][n];
    signal input in_x_sign[k][n];
    signal input in_y_pos[n][1];
    signal input in_y_sign[n][1];
    //output
    signal output out;


    //
    // 1. step | calculate mean x n
    //

    //make positive / negative
    // row k=1 is not being included since it's only 1s
    component calc_meanxn_x[k-1] = SigSum(n);
    signal tmp_x_sign[k-1][n];
    for (var j = 1; j < k; j++) {
        for (var i = 0; i < n; i++) {
            tmp_x_sign[j-1][i] <== in_x_sign[j][i] * in_x_pos[j][i];
            calc_meanxn_x[j-1].in[i] <== in_x_pos[j][i] - 2 * tmp_x_sign[j-1][i];
        }
    }

    component calc_meanxn_y = SigSum(n);
    signal tmp_y_sign[n];
    for (var i = 0; i < n; i++) {
        tmp_y_sign[i] <== in_y_sign[i][0] * in_y_pos[i][0];
        calc_meanxn_y.in[i] <== in_y_pos[i][0] - 2 * tmp_y_sign[i];
    }

    //handle negative interim values
    signal meanxn_x_sign[k-1];
    for (var j = 0; j < k-1; j++) {
        meanxn_x_sign[j] <-- calc_meanxn_x[j].out < 0;
        meanxn_x_sign[j] * (1 - meanxn_x_sign[j]) === 0;
    }

    signal meanxn_y_sign;
    meanxn_y_sign <-- calc_meanxn_y.out < 0;
    meanxn_y_sign * (1 - meanxn_y_sign) === 0;


    //
    // 2. step | check ranges
    //

    //calculate bits
    var bits_absdiff = 0;
    assert (dec >= require_meanxn_acc);
    while ( (2**bits_absdiff + 3) < (10**dec) ) {
        bits_absdiff++;
    }

    // get ranges
    component meanxn_range[k] = Range(dec, require_meanxn_acc, bits_absdiff);
    for (var j = 0; j < k; j++) {
        meanxn_range[j].target <== 0;

        if (j == k-1) {
            meanxn_range[j].actual <== calc_meanxn_y.out + (-2 * meanxn_y_sign * calc_meanxn_y.out);
        } else {
            meanxn_range[j].actual <== calc_meanxn_x[j].out + (-2 * meanxn_x_sign[j] * calc_meanxn_x[j].out);
        }
    }

    // get smallest element
    var bits_minelement = 0;
    while ( (2**bits_minelement + 3) < dec ) {
        bits_minelement++;
    }
    component minelement = VectorNormMinElement(k, bits_minelement);
    for (var j = 0; j < k; j++) {
        minelement.in[j] <== meanxn_range[j].out;
    }

    //assign output
    out <== minelement.out;
}

//////////////////////////////////////////////////////////

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
  "in_y_pos": [ [97321],[143963],[30089],[83936],[40821],[54358],[106308],[61942],[49049],[38546],[1763],[25160],[43361],[64217],[46016],[93416],[65734],[68009],[263790],[205393]  ],
  "in_n": 20
}
*/

//////////////////////////////////////////////////

//template checks the deviation of the sum of all squared values (= var x n), not var! Set require_varxn_acc dependent on n! Nevertheless, require_varxn_acc=5 turned out to be good up to n=500
template Check_VarXY(k, n, dec, dec_adjusted, require_varxn_acc) {
    signal input in_x_pos[k][n];
    signal input in_y_pos[n][1];
    signal input in_n;
    //output
    signal output out;


    //
    // 1. step | calculate var x n
    //

    component calc_varxn_x[k-1] = SigSum(n);
    for (var j = 1; j < k; j++) {
        for (var i = 0; i < n; i++) {
            calc_varxn_x[j-1].in[i] <== in_x_pos[j][i] * in_x_pos[j][i];
        }
    }

    component calc_varxn_y = SigSum(n);
    for (var i = 0; i < n; i++) {
        calc_varxn_y.in[i] <== in_y_pos[i][0] * in_y_pos[i][0];
    }


    //
    // 2. step | check ranges
    //

    //calculate bits
    var bits_absdiff = 0;
    assert (dec_adjusted >= require_varxn_acc);
    while ( (2**bits_absdiff + 3) < ( n * (10**(2*dec)) + 10**require_varxn_acc) ) {
        bits_absdiff++;
    }

    // get ranges
    component pow = Power(2*dec);
    pow.base <== 10;
    component varxn_range[k] = Range(dec_adjusted, require_varxn_acc, bits_absdiff);
    for (var j = 0; j < k; j++) {
        varxn_range[j].target <== 1 * in_n * pow.out;

        if (j == k-1) {
            varxn_range[j].actual <== calc_varxn_y.out;
        } else {
            varxn_range[j].actual <== calc_varxn_x[j].out;
        }
    }

    // get smallest element
    var bits_minelement = 0;
    while ( (2**bits_minelement + 3) < dec_adjusted ) {
        bits_minelement++;
    }
    component minelement = VectorNormMinElement(k, bits_minelement);
    for (var j = 0; j < k; j++) {
        minelement.in[j] <== varxn_range[j].out;
    }

    //assign output
    out <== minelement.out;
}

//component main = Check_MeanXY(5, 500, 5, 3);
//cf. Check_MeanXY(k, n, dec, require_meanxn_acc)

//component main = Check_VarXY(5, 500, 5, 5);
//cf. Check_VarXY(k, n, dec, require_var_acc)