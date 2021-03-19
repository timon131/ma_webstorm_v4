include "../../../../circomlib/circuits/comparators.circom";
include "sigsum.circom";

template Range(acc_step, bits) {
    signal input truth;
    signal input test;
    signal output out;

    signal current_range[acc_step + 1];
    current_range[0] <-- test / 10;
    current_range[0] * 10 === test;
    component comp_range[acc_step] = LessEqThan(bits);
    for (var i = 0; i < acc_step; i++) {
        comp_range[i].in[0] <== truth;
        comp_range[i].in[1] <== current_range[i];

        current_range[i+1] <-- current_range[i] / 10;
        current_range[i+1] * 10 === current_range[i];
    }

    component sum = SigSum(acc_step);
    for (var i = 0; i < acc_step; i++) {
        sum.in[i] <== comp_range[i].out;
    }
    out <== sum.out;
}