#
#Validate ptau ceremony; generate zkey files (input-agnostic & circuit-specific)
#

#command to get circuit info:
#snarkjs info -c circuit.r1cs
#snarkjs print -r circuit.r1cs -s circuit.sym

##########################################

# clear files
rm ../calcwit.cpp
rm ../calcwit.hpp
rm ../circom.hpp
rm ../circuit.cpp
rm ../circuit.dat
rm ../circuit.fast
rm ../circuit.fast.dat
rm ../circuit.r1cs
rm ../circuit.sym
rm ../circuit_0000.zkey
rm ../circuit_final.zkey
rm ../fr.asm
rm ../fr.cpp
rm ../fr.hpp
rm ../fr.o
rm ../main.cpp
rm ../proof.json
rm ../utils.cpp
rm ../utils.hpp
rm ../verification_key.json

rm data/witness.wtns
rm data/output.json
touch data/output.json


# Building circuit
npx snarkit compile ../../circuit --backend native

# Start a new zkey and make a contribution
snarkjs zkey new ../circuit.r1cs ../powersOfTau28_hez_final_22.ptau ../circuit_0000.zkey -v
snarkjs zkey contribute ../circuit_0000.zkey ../circuit_final.zkey --name="1st Contributor Name" -e="random" -v
# Export the verification key
snarkjs zkey export verificationkey ../circuit_final.zkey ../verification_key.json
# Infos about the circuit
snarkjs info -c ../circuit.r1cs