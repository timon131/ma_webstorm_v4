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