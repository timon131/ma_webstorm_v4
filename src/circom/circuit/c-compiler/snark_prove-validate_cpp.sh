#
#Generate witness and proof; validate the proof (input-specific & circuit-specific)
#

#calculate the witness and generate its file witness.wtns
echo "generate witness"
time npx snarkit check ../../circuit --backend native --witness_type bin

#generate the proof proof.json (either first: snarkjs | or second: rapidsnark) | generate input_public.json; contains the values of the public inputs and outputs
echo "generate proof"
#snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json input_public.json
time ../../../../rapidsnark/build/prover ../circuit_final.zkey ./data/witness.wtns ../proof.json ./data/output.json

#verify the proof
echo "verify proof"
time snarkjs groth16 verify ../verification_key.json ./data/output.json ../proof.json

#print sizes
echo "filesizes"
ls -lh ../circuit_final.zkey
ls -lh ../verification_key.json
ls -lh ../proof.json