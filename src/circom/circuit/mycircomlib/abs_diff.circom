include "../../../../circomlib/circuits/comparators.circom";

/*
{
  "in": 999938003408383,
  "test": 1000000000000000
}
*/

////////////////////////////////////////

template AbsDiff(bits) {
    signal input in_a;
    signal input in_b;
    signal output out;

    // in_a < in_b? | if comp.out == 0 <--> comp.in[0] is larger than comp.in[1]
    component comp_diff = LessThan(bits);
    comp_diff.in[0] <== in_a;
    comp_diff.in[1] <== in_b;
    signal comp_diff_result <== comp_diff.out;

    //calculate absolute difference between in_a and in_b
    signal tmp_diff_a <== (1 - comp_diff_result) * (in_a - in_b);
    signal tmp_diff_b <== comp_diff_result * (in_b - in_a);
    out <== tmp_diff_a + tmp_diff_b;
}