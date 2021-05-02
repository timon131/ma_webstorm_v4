const mimcsponge = require("./circomlib/src/mimcsponge.js");
//const mimc7 =  require("./circomlib/src/mimc7.js");
const poseidon =  require("./circomlib/src/poseidon.js");



let x = [0,0];

console.log(mimcsponge.multiHash(x,0,1));

console.log(poseidon(x));