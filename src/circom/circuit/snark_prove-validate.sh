#
#Generate witness and proof; validate the proof (input-specific & circuit-specific)
#

#calculate the witness and generate its file witness.wtns
snarkjs wtns calculate circuit.wasm input_private.json witness.wtns
# debug the witness (takes very long - don't do it when measuring performance!)
#snarkjs wtns debug circuit.wasm input_private.json witness.wtns circuit.sym --trigger --get --set

#generate the proof proof.json (either first: snarkjs | or second: rapidsnark) | generate input_public.json; contains the values of the public inputs and outputs
#snarkjs groth16 prove circuit_final.zkey witness.wtns proof.json input_public.json
../../../rapidsnark/build/prover circuit_final.zkey witness.wtns proof.json input_public.json

#verify the proof
snarkjs groth16 verify verification_key.json input_public.json proof.json