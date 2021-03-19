
import * as fs from 'fs';
import * as path from 'path';
import * as shelljs from 'shelljs';
import * as binFileUtils from '@iden3/binfileutils';
import { Scalar } from 'ffjavascript';
//import * as circom from '/node_modules/circom';
//import * as wtnsConvert from './wtns_convert.js';
//const wtnsConvert = require ('./wtns_convert');

/*
const fs = require('fs');
const path = require('path');
const shelljs = require('shelljs');
const binFileUtils = require('@iden3/binfileutils');
const { Scalar } = require('ffjavascript');
*/

const print_info = false;
const primeStr = '21888242871839275222246405745257275088548364400416034343698204186575808495617';

const circuitDirName = "~/WebstormProjects/ma_webstorm_v3/src/circom/circuit";

prepareCircuitDir(circuitDirName);
genWitness(circuitDirName);
wtnsConvertJson('witness.json', 'witness.wtns', primeStr);

function prepareCircuitDir(circuitDirName, { alwaysRecompile = false, verbose = false } = {}) {
    // console.log('compiling dir', circuitDirName);
    const circuitFilePath = path.join(circuitDirName, 'circuit.circom');
    const r1csFilepath = path.join(circuitDirName, 'circuit.r1cs');
    const symFilepath = path.join(circuitDirName, 'circuit.sym');
    const binaryFilePath = path.join(circuitDirName, 'circuit');
    if (alwaysRecompile || !fs.existsSync(binaryFilePath)) {
        if (verbose) {
            console.log('compile', circuitDirName);
        }
        compileNativeBinary({ circuitDirName, r1csFilepath, circuitFilePath, symFilepath, binaryFilePath });
    } else {
        if (verbose) {
            console.log('skip compiling binary ', binaryFilePath);
        }
    }
    return { circuitFilePath, r1csFilepath, symFilepath, binaryFilePath };
}

function compileNativeBinary({ circuitDirName, r1csFilepath, circuitFilePath, symFilepath, binaryFilePath }) {
    const circomRuntimePath = path.join(__dirname, '..', '..', '..', 'node_modules', 'circom_runtime');
    const snarkjsPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'snarkjs', 'build', 'cli.cjs');
    const ffiasmPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'ffiasm');
    const circomcliPath = path.join(__dirname, '..', '..', '..', 'node_modules', 'circom', 'cli.js');
    const cFilepath = path.join(circuitDirName, 'circuit.c');

    var cmd;
    //var cmd: string;
    cmd = `cp ${circomRuntimePath}/c/*.cpp ${circuitDirName}`;
    shelljs.exec(cmd);
    cmd = `cp ${circomRuntimePath}/c/*.hpp ${circuitDirName}`;
    shelljs.exec(cmd);
    cmd = `node ${ffiasmPath}/src/buildzqfield.js -q ${primeStr} -n Fr`;
    //shelljs.exec(cmd, { cwd: circuitDirName });
    shelljs.exec(cmd);
    //cmd = `mv fr.asm fr.cpp fr.hpp ${circuitDirName}`;
    //shelljs.exec(cmd);
    if (process.platform === 'darwin') {
        cmd = `nasm -fmacho64 --prefix _  ${circuitDirName}/fr.asm`;
    } else if (process.platform === 'linux') {
        cmd = `nasm -felf64 ${circuitDirName}/fr.asm`;
    } else throw 'Unsupported platform';
    shelljs.exec(cmd);
    cmd = `NODE_OPTIONS=--max-old-space-size=8192 node --stack-size=65500 ${circomcliPath} ${circuitFilePath} -r ${r1csFilepath} -c ${cFilepath} -s ${symFilepath}`;
    shelljs.exec(cmd);
    if (print_info) {
        cmd = `NODE_OPTIONS=--max-old-space-size=8192 node ${snarkjsPath} r1cs info ${r1csFilepath}`;
        shelljs.exec(cmd);
        // cmd = `NODE_OPTIONS=--max-old-space-size=8192 node ${snarkjsPath} r1cs print ${r1csFilepath} ${symFilepath}`;
        // shelljs.exec(cmd);
    }
    if (process.platform === 'darwin') {
        cmd = `g++ ${circuitDirName}/main.cpp ${circuitDirName}/calcwit.cpp ${circuitDirName}/utils.cpp ${circuitDirName}/fr.cpp ${circuitDirName}/fr.o ${cFilepath} -o ${binaryFilePath} -lgmp -std=c++11 -O3 -DSANITY_CHECK`;
        if (process.arch === 'arm64') {
            cmd = 'arch -x86_64 ' + cmd;
        } else {
            //cmd = cmd + ' -fopenmp';
        }
    } else if (process.platform === 'linux') {
        cmd = `g++ -pthread ${circuitDirName}/main.cpp ${circuitDirName}/calcwit.cpp ${circuitDirName}/utils.cpp ${circuitDirName}/fr.cpp ${circuitDirName}/fr.o ${cFilepath} -o ${binaryFilePath} -lgmp -std=c++11 -O3 -fopenmp -DSANITY_CHECK`;
    } else throw 'Unsupported platform';
    shelljs.exec(cmd);
}

function genWitness(circuitDirName){
    var cmd;
    const binaryFilePath = path.join(circuitDirName, 'circuit');
    const inputFilePath = path.join(circuitDirName, 'input_private.json');
    //const witnessFilePath = path.join(path.dirname(inputFilePath), 'witness.json');
    const witnessFilePath = path.join(circuitDirName, 'witness.json');
    // gen witness
    cmd = `${binaryFilePath} ${inputFilePath} ${witnessFilePath}`;
    //const genWtnsOut = shelljs.exec(cmd);
    shelljs.exec(cmd);
}

async function wtnsConvertJson(jsonFileName, wtnsFileName, prime) {
    const w = JSON.parse(fs.readFileSync(jsonFileName));
    const fdWtns = await binFileUtils.createBinFile(wtnsFileName, "wtns", 2, 2);

    const p = Scalar.fromString(prime, 10);
    await write(fdWtns, w, p);
    await fdWtns.close();
}


//
// copied from https://github.com/iden3/snarkjs/blob/master/src/wtns_utils.js
//
export async function write(fd, witness, prime) {

    await binFileUtils.startWriteSection(fd, 1);
    const n8 = (Math.floor( (Scalar.bitLength(prime) - 1) / 64) +1)*8;
    await fd.writeULE32(n8);
    await binFileUtils.writeBigInt(fd, prime, n8);
    await fd.writeULE32(witness.length);
    await binFileUtils.endWriteSection(fd);

    await binFileUtils.startWriteSection(fd, 2);
    for (let i=0; i<witness.length; i++) {
        await binFileUtils.writeBigInt(fd, witness[i], n8);
    }
    await binFileUtils.endWriteSection(fd, 2);


}

export async function writeBin(fd, witnessBin, prime) {

    await binFileUtils.startWriteSection(fd, 1);
    const n8 = (Math.floor( (Scalar.bitLength(prime) - 1) / 64) +1)*8;
    await fd.writeULE32(n8);
    await binFileUtils.writeBigInt(fd, prime, n8);
    if (witnessBin.byteLength % n8 != 0) {
        throw new Error("Invalid witness length");
    }
    await fd.writeULE32(witnessBin.byteLength / n8);
    await binFileUtils.endWriteSection(fd);


    await binFileUtils.startWriteSection(fd, 2);
    await fd.write(witnessBin);
    await binFileUtils.endWriteSection(fd);

}

export async function readHeader(fd, sections) {

    await binFileUtils.startReadUniqueSection(fd, sections, 1);
    const n8 = await fd.readULE32();
    const q = await binFileUtils.readBigInt(fd, n8);
    const nWitness = await fd.readULE32();
    await binFileUtils.endReadSection(fd);

    return {n8, q, nWitness};

}

export async function read(fileName) {

    const {fd, sections} = await binFileUtils.readBinFile(fileName, "wtns", 2);

    const {n8, nWitness} = await readHeader(fd, sections);

    await binFileUtils.startReadUniqueSection(fd, sections, 2);
    const res = [];
    for (let i=0; i<nWitness; i++) {
        const v = await binFileUtils.readBigInt(fd, n8);
        res.push(v);
    }
    await binFileUtils.endReadSection(fd);

    await fd.close();

    return res;
}