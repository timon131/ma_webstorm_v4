include "./circuits/mimc.circom";
include "./circuits/mimcsponge.circom";
include "./circuits/eddsamimcsponge.circom";


//check MiMC(input left, input right) = hash
template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = MiMCSponge(2, 220, 1);
  left ==> hasher.ins[0];
  right ==> hasher.ins[1];
  hasher.k <== 0;

  hash <== hasher.outs[0];
}

template Selector() {
  signal input input_elem;
  signal input path_elem;
  signal input path_index;

  signal output left;
  signal output right;

  signal left_selector_1;
  signal left_selector_2;
  signal right_selector_1;
  signal right_selector_2;

  //require path_index to be either 0 or 1
  path_index * (1-path_index) === 0

  left_selector_1 <== (1 - path_index)*input_elem;
  left_selector_2 <== (path_index)*path_elem;
  right_selector_1 <== (path_index)*input_elem;
  right_selector_2 <== (1 - path_index)*path_elem;

  left <== left_selector_1 + left_selector_2;
  right <== right_selector_1 + right_selector_2;
}

template GetMerkleRoot(level) {

    signal input leaf;
    //signal input path_index[level] defines an array with length = level
    signal input path_index[level];
    signal input path_elements[level];

    signal output out;

    component selectors[level];
    component hashers[level];

    for (var i = 0; i < level; i++) {
      selectors[i] = Selector();
      hashers[i] = HashLeftRight();

      path_index[i] ==> selectors[i].path_index;
      path_elements[i] ==> selectors[i].path_elem;

      selectors[i].left ==> hashers[i].left;
      selectors[i].right ==> hashers[i].right;
    }

    leaf ==> selectors[0].input_elem;

    for (var i = 1; i < level; i++) {
      hashers[i-1].hash ==> selectors[i].input_elem;
    }

    out <== hashers[level - 1].hash;
}

component main = GetMerkleRoot(2);


///////////////////////

template Multiplier() {
    signal private input x;
    signal private input y;
    signal output c;
    c <== x*y;
 }

component main = Multiplier();

///////////////////////

include "./node_modules/circomlib/circuits/mimcsponge.circom";

template HashLeftRight() {

    signal private input x;
    signal private input y;

    signal output h;

    component mimc = MiMCSponge(2, 220, 1);

    mimc.ins[0] <== x;
    mimc.ins[1] <== y;
    mimc.k <== 0;

    h <== mimc.outs[0];

}

component main = HashLeftRight();

///////////////////

include "./node_modules/circomlib/circuits/mimcsponge.circom";

//Hashed values are within quotation marks!

//check MiMC(input left, input right) = hash
template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = MiMCSponge(2, 220, 1);
  left ==> hasher.ins[0];
  right ==> hasher.ins[1];
  hasher.k <== 0;

  hash <== hasher.outs[0];
}

template Selector() {
  signal input input_elem;
  signal input path_elem;
  signal input path_index;

  signal output left;
  signal output right;

  signal left_selector_1;
  signal left_selector_2;
  signal right_selector_1;
  signal right_selector_2;

  //require path_index to be either 0 or 1
  path_index * (1-path_index) === 0

  left_selector_1 <== (1 - path_index)*input_elem;
  left_selector_2 <== (path_index)*path_elem;
  right_selector_1 <== (path_index)*input_elem;
  right_selector_2 <== (1 - path_index)*path_elem;

  left <== left_selector_1 + left_selector_2;
  right <== right_selector_1 + right_selector_2;
}

template GetMerkleRoot(level) {

    signal input leaf;
    //signal input path_index[level] defines an array with length = level
    signal input path_index[level];
    signal input path_elements[level];

    signal output out;

    component selectors[level];
    component hashers[level];

    for (var i = 0; i < level; i++) {
      selectors[i] = Selector();
      hashers[i] = HashLeftRight();

      path_index[i] ==> selectors[i].path_index;
      path_elements[i] ==> selectors[i].path_elem;

      selectors[i].left ==> hashers[i].left;
      selectors[i].right ==> hashers[i].right;
    }

    leaf ==> selectors[0].input_elem;

    for (var i = 1; i < level; i++) {
      hashers[i-1].hash ==> selectors[i].input_elem;
    }

    out <== hashers[level - 1].hash;
}

component main = GetMerkleRoot(4);

///////////////////

/
template merkleproof (level) {



    signal private input root;
    signal private input value;



    signal private input path_idx[level];
    signal private input path_element[level];




    //__1. verify attribute existence;
    component attributeExistence = GetMerkleRoot(level);
    attributeExistence.leaf <== value;
    for (var i=0; i<level; i++) {
        attributeExistence.path_index[i] <== path_idx[i];
        attributeExistence.path_elements[i] <== path_element[i];
    }
    attributeExistence.out === root;

}
/

///////////////////

include "./node_modules/circomlib/circuits/mimcsponge.circom";

//Hashed values are within quotation marks!

//check MiMC(input left, input right) = hash
template Multiplier() {
    signal private input x;
    signal private input y;
    signal output c;
    c <== x*y;
 }

component main = Multiplier();

/
template HashLeftRight() {
  signal input left;
  signal input right;

  signal output hash;

  component hasher = MiMCSponge(2, 220, 1);
  left ==> hasher.ins[0];
  right ==> hasher.ins[1];
  hasher.k <== 0;

  hash <== hasher.outs[0];
}


template Selector() {
  signal input input_elem;
  signal input path_elem;
  signal input path_index;

  signal output left;
  signal output right;

  signal left_selector_1;
  signal left_selector_2;
  signal right_selector_1;
  signal right_selector_2;

  //require path_index to be either 0 or 1
  path_index * (1-path_index) === 0;

  left_selector_1 <== (1 - path_index)*input_elem;
  left_selector_2 <== (path_index)*path_elem;
  right_selector_1 <== (path_index)*input_elem;
  right_selector_2 <== (1 - path_index)*path_elem;

  left <== left_selector_1 + left_selector_2;
  right <== right_selector_1 + right_selector_2;
}

template GetMerkleRoot(level) {

    signal private input leaf;
    //signal input path_index[level] defines an array with length = level
    signal private input path_index[level];
    signal private input path_elements[level];

    signal public output out;

    component selectors[level];
    component hashers[level];

    //for i=0:
    selectors[0] = Selector();
    hashers[0] = HashLeftRight();

    leaf ==> selectors[0].input_elem;
    path_index[0] ==> selectors[0].path_index;
    path_elements[0] ==> selectors[0].path_elem;

    selectors[0].left ==> hashers[0].left;
    selectors[0].right ==> hashers[0].right;

    for (var i = 1; i < level; i++) {
      selectors[i] = Selector();
      hashers[i] = HashLeftRight();

      path_index[i] ==> selectors[i].path_index;
      path_elements[i] ==> selectors[i].path_elem;
      hashers[i-1].hash ==> selectors[i].input_elem;

      selectors[i].left ==> hashers[i].left;
      selectors[i].right ==> hashers[i].right;
    }

    out <== hashers[level - 1].hash;
}
/
//component main = GetMerkleRoot(4);
component main = HashLeftRight();