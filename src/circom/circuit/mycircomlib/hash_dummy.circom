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

    outs[0] <== in * 20636625426020718969131298365984859231982649550971729229988535915544421356929;
}

template PoseidonDummy_two() {
    signal input in;
    signal output out;

    out <== in * 14744269619966411208579211824598458697587494354926760081771325075741142829156;
}