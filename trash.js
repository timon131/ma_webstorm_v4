const mimcsponge = require("./circomlib/src/mimcsponge.js");
//const mimc7 =  require("./circomlib/src/mimc7.js");
const poseidon =  require("./circomlib/src/poseidon.js");



let x = [
    BigInt("14408838593220040598588012778523101864903887657864399481915450526643617223637"),
    BigInt("14408838593220040598588012778523101864903887657864399481915450526643617223637")
];

console.log(mimcsponge.multiHash(x,0,1));

console.log(poseidon(x));