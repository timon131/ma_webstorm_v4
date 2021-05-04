template MiMCDummy_six() {
    signal input in;
    signal output outs[1];

    outs[0] <== in * 6050119841701123496567340776368302076328541353499782617188425432224264569804;
}

template PoseidonDummy_six() {
    signal input in;
    signal output out;

    out <== in * 14408838593220040598588012778523101864903887657864399481915450526643617223637;
}

template MiMCDummy_two() {
    signal input in;
    signal output outs[1];

    outs[0] <== in * 11096077253280157052144759413818241113719694874276798690043812315890362794227;
}

template PoseidonDummy_two() {
    signal input in;
    signal output out;

    out <== in * 7326749667613061204673979992952607579764233404352098275191723501970649593968;
}