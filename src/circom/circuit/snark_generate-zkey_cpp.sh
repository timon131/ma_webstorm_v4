#
#Validate ptau ceremony; generate zkey files (input-agnostic & circuit-specific)
#

#command to get circuit info:
#snarkjs info -c circuit.r1cs
#snarkjs print -r circuit.r1cs -s circuit.sym

##########################################

# Building circuit
circom circuit.circom --r1cs --sym -c




# Start a new zkey and make a contribution
snarkjs zkey new circuit.r1cs powersOfTau28_hez_final_20.ptau circuit_0000.zkey -v
snarkjs zkey contribute circuit_0000.zkey circuit_final.zkey --name="1st Contributor Name" -e="random" -v
# Export the verification key
snarkjs zkey export verificationkey circuit_final.zkey verification_key.json
# Infos about the circuit
snarkjs info -c circuit.r1cs