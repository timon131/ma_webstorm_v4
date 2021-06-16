template SigSum(n) {
    signal input in[n];
    signal output out;

    //calculate sum
    signal tmp[n];
    tmp[0] <== in[0];
    for (var i = 1; i < n; i++) {
        tmp[i] <== tmp[i-1] + in[i];
    }

    // assign output
    out <== tmp[n-1];
}


template SigSumNeg(n) {
    signal input in_pos[n];
    signal input in_sign[n];
    signal output out_pos;
    signal output out_sign;
    // sign: 0 for positive | 1 for negative

    //make negative
    signal sig_in[n];
    signal multi_in[n];
    for (var i = 0; i < n; i++) {
        multi_in[i] <== 1 - 2 * in_sign[i];
        sig_in[i] <== multi_in[i] * in_pos[i];
    }

    //calculate sum
    signal tmp[n];
    tmp[0] <== sig_in[0];
    for (var i = 1; i < n; i++) {
        tmp[i] <== tmp[i-1] + sig_in[i];
    }

    //handle negative values and assign outputs
    out_sign <-- tmp[n-1] < 0;
    out_sign * (out_sign - 1) === 0;
    out_pos <== tmp[n-1] + (-2 * out_sign * tmp[n-1]);
}



template SigSumFract(n) {
    signal input in_n[n];
    signal input in_d[n];
    signal input in_sign[n];
    signal output out_n;
    signal output out_d;
    // 0 for positive | 1 for negative
    signal output out_sign;


    //make negative
    signal sig_in_n[n];
    signal multi_in_n[n];
    for (var i = 0; i < n; i++) {
        multi_in_n[i] <== 1 - 2 * in_sign[i];
        sig_in_n[i] <== multi_in_n[i] * in_n[i];
    }

    //calculate sum
    signal tmp_n[n];
    signal tmp_d[n];
    signal multi_n[n-1];
    tmp_n[0] <== sig_in_n[0];
    tmp_d[0] <== in_d[0];
    for (var i = 0; i < n-1; i++) {
        multi_n[i] <== tmp_n[i] * in_d[i+1];
        tmp_n[i+1] <== multi_n[i] + sig_in_n[i+1] * tmp_d[i];
        tmp_d[i+1] <== tmp_d[i] * in_d[i+1];
    }

    //handle negative values and assign outputs
    out_sign <-- tmp_n[n-1] < 0;
    out_sign * (out_sign - 1) === 0;
    out_n <== tmp_n[n-1] + (-2 * out_sign * tmp_n[n-1]);
    out_d <== tmp_d[n-1];
}