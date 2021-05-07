#
#Generate witness and proof; validate the proof (input-specific & circuit-specific)
#

#calculate the witness and generate its file witness.wtns
npx snarkit check ../../circuit --backend native --witness_type bin

#generate the proof proof.json (either first: snarkjs | or second: rapidsnark) | generate input_public.json; contains the values of the public inputs and outputs
#snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json input_public.json
../../../../rapidsnark/build/prover ../circuit_final.zkey ./data/witness.wtns ../proof.json ./data/output.json

#verify the proof
snarkjs groth16 verify ../verification_key.json ./data/output.json ../proof.json