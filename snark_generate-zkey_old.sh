#
#Validate ptau ceremony; generate zkey files (input-agnostic & circuit-specific)
#

#command to get circuit info:
#snarkjs info -c circuit.r1cs
#snarkjs print -r circuit.r1cs -s circuit.sym

##########################################

circom circuit.circom --r1cs --wasm --sym -v

snarkjs r1cs export json circuit.r1cs circuit.r1cs.json
cat circuit.r1cs.json

#generate circuit_0000; contains the proving and verification keys together with all phase 2 contributions
snarkjs zkey new circuit.r1cs pot12_final.ptau circuit_0000.zkey

#generate circuit_final.zkey; will be used to export the verification key
snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v -e="Another random entropy"

snarkjs zkey contribute circuit_0001.zkey circuit_0002.zkey --name="Second contribution Name" -v -e="Another random entropy"

#snarkjs zkey export bellman circuit_0002.zkey  challenge_phase2_0003
#snarkjs zkey bellman contribute bn128 challenge_phase2_0003 response_phase2_0003 -e="some random text"
#snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="Third contribution name"

snarkjs zkey verify circuit.r1cs pot12_final.ptau circuit_0002.zkey

snarkjs zkey beacon circuit_0002.zkey circuit_final.zkey 0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f 10 -n="Final Beacon phase2"

snarkjs zkey verify circuit.r1cs pot12_final.ptau circuit_final.zkey

#export verification key from circuit_final.zkey into the file verification_key.json
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json