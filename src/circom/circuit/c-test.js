"use strict";
exports.__esModule = true;
var fs = require("fs");
var path = require("path");
var shelljs = require("shelljs");
//import * as circom from '/node_modules/circom';
var print_info = false;
var primeStr = '21888242871839275222246405745257275088548364400416034343698204186575808495617';
prepareCircuitDir("~/WebstormProjects/ma_webstorm_v3/src/circom/circuit");
function prepareCircuitDir(circuitDirName, _a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.alwaysRecompile, alwaysRecompile = _c === void 0 ? false : _c, _d = _b.verbose, verbose = _d === void 0 ? false : _d;
    // console.log('compiling dir', circuitDirName);
    var circuitFilePath = path.join(circuitDirName, 'circuit.circom');
    var r1csFilepath = path.join(circuitDirName, 'circuit.r1cs');
    var symFilepath = path.join(circuitDirName, 'circuit.sym');
    var binaryFilePath = path.join(circuitDirName, 'circuit');
    if (alwaysRecompile || !fs.existsSync(binaryFilePath)) {
        if (verbose) {
            console.log('compile', circuitDirName);
        }
        compileNativeBinary({ circuitDirName: circuitDirName, r1csFilepath: r1csFilepath, circuitFilePath: circuitFilePath, symFilepath: symFilepath, binaryFilePath: binaryFilePath });
    }
    else {
        if (verbose) {
            console.log('skip compiling binary ', binaryFilePath);
        }
    }
    return { circuitFilePath: circuitFilePath, r1csFilepath: r1csFilepath, symFilepath: symFilepath, binaryFilePath: binaryFilePath };
}
function compileNativeBinary(_a) {
    var circuitDirName = _a.circuitDirName, r1csFilepath = _a.r1csFilepath, circuitFilePath = _a.circuitFilePath, symFilepath = _a.symFilepath, binaryFilePath = _a.binaryFilePath;
    var circomRuntimePath = path.join(__dirname, '..', '..', '..', 'node_modules', 'circom_runtime');
    var snarkjsPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'snarkjs', 'build', 'cli.cjs');
    var ffiasmPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'ffiasm');
    var circomcliPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'circom', 'cli.js');
    var cFilepath = path.join(circuitDirName, 'circuit.c');
    var cmd;
    //var cmd: string;
    cmd = "cp " + circomRuntimePath + "/c/*.cpp " + circuitDirName;
    shelljs.exec(cmd);
    cmd = "cp " + circomRuntimePath + "/c/*.hpp " + circuitDirName;
    shelljs.exec(cmd);
    cmd = "node " + ffiasmPath + "/src/buildzqfield.js -q " + primeStr + " -n Fr";
    shelljs.exec(cmd, { cwd: circuitDirName });
    //cmd = `mv fr.asm fr.cpp fr.hpp ${circuitDirName}`;
    //shelljs.exec(cmd);
    if (process.platform === 'darwin') {
        cmd = "nasm -fmacho64 --prefix _  " + circuitDirName + "/fr.asm";
    }
    else if (process.platform === 'linux') {
        cmd = "nasm -felf64 " + circuitDirName + "/fr.asm";
    }
    else
        throw 'Unsupported platform';
    shelljs.exec(cmd);
    cmd = "NODE_OPTIONS=--max-old-space-size=8192 node --stack-size=65500 " + circomcliPath + " " + circuitFilePath + " -r " + r1csFilepath + " -c " + cFilepath + " -s " + symFilepath;
    shelljs.exec(cmd);
    if (print_info) {
        cmd = "NODE_OPTIONS=--max-old-space-size=8192 node " + snarkjsPath + " r1cs info " + r1csFilepath;
        shelljs.exec(cmd);
        // cmd = `NODE_OPTIONS=--max-old-space-size=8192 node ${snarkjsPath} r1cs print ${r1csFilepath} ${symFilepath}`;
        // shelljs.exec(cmd);
    }
    if (process.platform === 'darwin') {
        cmd = "g++ " + circuitDirName + "/main.cpp " + circuitDirName + "/calcwit.cpp " + circuitDirName + "/utils.cpp " + circuitDirName + "/fr.cpp " + circuitDirName + "/fr.o " + cFilepath + " -o " + binaryFilePath + " -lgmp -std=c++11 -O3 -DSANITY_CHECK";
        if (process.arch === 'arm64') {
            cmd = 'arch -x86_64 ' + cmd;
        }
        else {
            //cmd = cmd + ' -fopenmp';
        }
    }
    else if (process.platform === 'linux') {
        cmd = "g++ -pthread " + circuitDirName + "/main.cpp " + circuitDirName + "/calcwit.cpp " + circuitDirName + "/utils.cpp " + circuitDirName + "/fr.cpp " + circuitDirName + "/fr.o " + cFilepath + " -o " + binaryFilePath + " -lgmp -std=c++11 -O3 -fopenmp -DSANITY_CHECK";
    }
    else
        throw 'Unsupported platform';
    shelljs.exec(cmd);
}
