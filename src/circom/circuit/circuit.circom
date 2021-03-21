template SC_test() {
    signal private input a;
    signal private input b;
    signal output c;

    c <== a * b;
}

component main = SC_test();