const mimcsponge = require("./circomlib/src/mimcsponge.js");
//const mimc7 =  require("./circomlib/src/mimc7.js");
const poseidon =  require("./circomlib/src/poseidon.js");

///////////////////////

//function to convert BigInt to string
BigInt.prototype.toJSON = function() { return this.toString()  }
//command to convert BigInt to string: 'JSON.stringify(BigInt(hashes[0]))'
//const a = int2hex(JSON.stringify(BigInt(hashes[0])))


function build_merkletree(x_round_pos, x_round_sign, y_round_pos, y_round_sign, hash_alg) {

    //
    // 1. step | handle negative values
    //

    //define prime p
    const p = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

    //transform negative y_round values to prime field representation
    let y_round_field = [];
    for (let j = 0; j < y_round_pos.length; j++) {
        y_round_field[j] = [];
        // if negative: p - y_round[j][0]
        if (y_round_sign[j][0] == 1) {
            y_round_field[j][0] = p - BigInt(y_round_pos[j][0]);
        } else {
            y_round_field[j][0] = y_round_pos[j][0];
        }
    }

    //transform negative x_round values to prime field representation
    let x_round_field = [];
    for (let j = 0; j < x_round_pos.length; j++) {
        x_round_field[j] = [];
        for (let i = 0; i < x_round_pos[j].length; i++) {
            // if negative: p - x_round[j][i]
            if (x_round_sign[j][i] == 1) {
                x_round_field[j][i] = p - BigInt(x_round_pos[j][i]);
            } else {
                x_round_field[j][i] = x_round_pos[j][i];
            }
        }
    }

    //
    // 2. step | initialize leafs array (raw values (i.e., not hashed))
    //

    const data_leafs = [];

    //push y values
    for (let i = 0; i < y_round_field.length; i++) {
        data_leafs.push(y_round_field[i][0]);
    }

    //push x values
    for (let j = 0; j < x_round_field.length; j++) {
        for (let i = 0; i < x_round_field[j].length; i++) {
            data_leafs.push(x_round_field[j][i]);
        }
    }

    //initialize merkle tree depth (i.e., level)
    const level = Math.ceil(Math.log2(data_leafs.length));

    //fill all empty "cells" of leafs array until 2**level with 0s
    for (let i = data_leafs.length; i < 2 ** level; i++) {
        data_leafs[i] = 0;
    }

    //compute merkle tree
    const tree = compute_tree(data_leafs, level, hash_alg);

    return {
        "tree": tree,
        "root": tree.root,
        "level": level
    };
}

//Computes root from bigInts; returns tree (incl. root, path_index, and path_elements)
//path_index: 0 for right inter-element | 1 for left inter-element
//path_elements: respective inter-elements along the path to the root
function compute_tree(leafs, level, hash_alg) {
    // initialize merkle tree
    let tree = init_merkle_tree(level, hash_alg)

    //insert values into tree (bigInts[index])
    //index == 0, ..., number of leafs
    for (let index = 0; index < 2**level; index++) {
        tree = insert_merkle_tree(level, tree, index, leafs[index], hash_alg);
    }

    return {
        "root": tree.root,
        "tree": tree,
    };
}

function init_merkle_tree(level, hash_alg) {
    //initialize tree with BigInt(0)
    let tree = [];
    let pos_tmp = [];
    for (let i = 0; i < level; i++) {
        let tree_level = [];
        for (let j = 0; j < Math.pow(2, level - i); j++) {
            if (i == 0) {
                if (hash_alg == 0) {
                    tree_level.push(mimcsponge.multiHash([BigInt(0)]));
                } else if (hash_alg == 1) {
                    pos_tmp[0] = BigInt(0);
                    tree_level.push(poseidon(pos_tmp));
                }
            } else {
                if (hash_alg == 0) {
                    tree_level.push(mimcsponge.multiHash([tree[i-1][2*j], tree[i-1][2*j+1]]));
                } else if (hash_alg == 1) {
                    pos_tmp = [tree[i-1][2*j], tree[i-1][2*j+1]];
                    tree_level.push(poseidon(pos_tmp));
                }
            }
        }
        tree.push(tree_level);
    }

    //assign root
    let root;
    if (hash_alg == 0) {
        root = mimcsponge.multiHash([ tree[level - 1][0], tree[level - 1][1] ]);
    } else if (hash_alg == 1) {
        pos_tmp = [ tree[level - 1][0], tree[level - 1][1] ];
        root = poseidon(pos_tmp);
    }

    return {
        "tree": tree,
        "root": root
    };
}

function insert_merkle_tree(level, complete_tree, index, leaf, hash_alg) {
    //function call above: insert_merkle_tree(level, tree, index, bigInts[index]) | index: 0,...,number of leafs
    let current_index = index;
    let path_index = [];
    let path_elements = [];
    let localTree = [];
    let tree = complete_tree.tree;
    let pos_tmp = [];

    for (let i = 0; i < level; i++) {
        //i: levels (level 0: leafs) | j: number of nodes at current level i
        let tree_level = [];
        path_index.push(current_index % 2);

        for (let j = 0; j < Math.pow(2, level - i); j++) {
            if (i == 0) {
                //do when on leaf level:
                if (j == index) {
                    //when being at the node on leaf level, that belongs to bigInts[index], then write in that exact value
                    tree_level.push(leaf);
                } else {
                    //else, just leave the value that was there
                    tree_level.push(tree[0][j])
                }
            } else {
                //when not on leaf level, hash both predecessor nodes
                if (hash_alg == 0) {
                    tree_level.push(mimcsponge.multiHash([localTree[i-1][2*j], localTree[i-1][2*j+1]]));
                } else if (hash_alg == 1) {
                    pos_tmp = [localTree[i-1][2*j], localTree[i-1][2*j+1]];
                    tree_level.push(poseidon(pos_tmp));
                }
            }
        }

        if (current_index % 2 == 0) {
            path_elements.push(tree_level[current_index + 1]);
        } else {
            path_elements.push(tree_level[current_index - 1]);
        }

        localTree.push(tree_level)
        current_index = Math.floor(current_index / 2);
    }

    //create root hash
    let root;
    if (hash_alg == 0) {
        root = mimcsponge.multiHash([localTree[level - 1][0], localTree[level - 1][1]]);
    } else if (hash_alg == 1) {
        pos_tmp = [localTree[level - 1][0], localTree[level - 1][1]];
        root = poseidon(pos_tmp);
    }

    return {
        "root": root,
        "tree": localTree,
    };
};


/////////////////////////////////////////

module.exports = {
    //functions:
    build_merkletree
    //values:
};