include "../../../../circomlib/circuits/comparators.circom";
include "sigsum.circom";
include "abs_diff.circom";
include "power.circom";

template Range(dec_adjusted, steps, bits_absdiff) {
    signal input actual;
    signal input target;
    signal output out;

    // make sure that steps are valid
    assert(dec_adjusted >= steps);

    // calculate difference between target and actual
    component absdiff = AbsDiff(bits_absdiff);
    absdiff.in_a <== actual;
    absdiff.in_b <== target;

    // calculate initial test range and bits_comp_range
    component pow = Power(dec_adjusted - 1);
    pow.base <== 10;
    var bits_comp_range = 0;
    while (2**bits_comp_range + 2 <= 10**(dec_adjusted - 1)) {
        bits_comp_range++;
    }

    // check accuracies
    signal current_range[steps + 1];
    current_range[0] <== pow.out;
    component comp_range[steps] = LessEqThan(bits_comp_range);
    for (var i = 0; i < steps; i++) {
        comp_range[i].in[0] <== absdiff.out;
        comp_range[i].in[1] <== current_range[i];

        current_range[i+1] <-- current_range[i] / 10;
        current_range[i+1] * 10 === current_range[i];
    }

    // get accuracy
    component sum = SigSum(steps);
    for (var i = 0; i < steps; i++) {
        sum.in[i] <== comp_range[i].out;
    }
    out <== sum.out;
}

//component main = Range(5, 3, 100);