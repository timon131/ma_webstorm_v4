template Power(pot) {
    signal input base;
    signal output out;

    signal tmp[pot];
    tmp[0] <== base;
    for (var i = 1; i < pot; i++) {
        tmp[i] <== tmp[i-1] * base;
    }
    out <== tmp[pot-1];
}

//component main = power(15);