include "../../../../circomlib/circuits/comparators.circom";

/*
{
  "in":
    [
      [15533,23,2381,5154],
      [23,15487,8190,10671],
      [2381,8190,27889,20390],
      [5154,10671,20390,32613]
    ]
}
*/

////////////////////////////////////////////

template NormMaxElement(k, n, bits) {
    signal input in[k][n];
    signal output out;

    //make sure that matrix size is feasible
    assert (n >= 2);

    //
    // 2. step | get biggest element
    //

    signal check[k*n];
    check[0] <== in[0][0];
    signal check_a[k*n - 1];
    signal check_b[k*n - 1];
    component greater[k*n - 1] = GreaterThan(bits);
    var index = 1;
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            if (i <= n-2) {
                //normal
                greater[index - 1].in[0] <== check[index - 1];
                greater[index - 1].in[1] <== in[j][i+1];

                check_a[index - 1] <== greater[index - 1].out * check[index - 1];
                check_b[index - 1] <== (1 - greater[index - 1].out) * in[j][i+1];
                check[index] <== check_a[index - 1] + check_b[index - 1];
            } else if (j < k-1 && i > 2) {
                //end of row: jump to next row
                //do nothing in last row
                greater[index - 1].in[0] <== check[index - 1];
                greater[index - 1].in[1] <== in[j+1][0];

                check_a[index - 1] <== greater[index - 1].out * check[index - 1];
                check_b[index - 1] <== (1 - greater[index - 1].out) * in[j+1][0];
                check[index] <== check_a[index - 1] + check_b[index - 1];
            }
            index++;
        }
    }

    out <== check[k*n - 1];
}


template NormMinElement(k, n, bits) {
    signal input in[k][n];
    signal output out;

    //make sure that matrix size is feasible
    assert (n >= 2);

    //
    // 2. step | get minimum element
    //

    signal check[k*n];
    check[0] <== in[0][0];
    signal check_a[k*n - 1];
    signal check_b[k*n - 1];
    component smaller[k*n - 1] = LessThan(bits);
    var index = 1;
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            if (i <= n-2) {
                //normal
                smaller[index - 1].in[0] <== check[index - 1];
                smaller[index - 1].in[1] <== in[j][i+1];

                check_a[index - 1] <== smaller[index - 1].out * check[index - 1];
                check_b[index - 1] <== (1 - smaller[index - 1].out) * in[j][i+1];
                check[index] <== check_a[index - 1] + check_b[index - 1];
            } else if (j < k-1 && i > 2) {
                //end of row: jump to next row
                //do nothing in last row
                smaller[index - 1].in[0] <== check[index - 1];
                smaller[index - 1].in[1] <== in[j+1][0];

                check_a[index - 1] <== smaller[index - 1].out * check[index - 1];
                check_b[index - 1] <== (1 - smaller[index - 1].out) * in[j+1][0];
                check[index] <== check_a[index - 1] + check_b[index - 1];
            }
            index++;
        }
    }

    out <== check[k*n - 1];
}

template VectorNormMinElement(n, bits) {
    signal input in[n];
    signal output out;

    //make sure that matrix size is feasible
    assert (n >= 2);

    //
    // 2. step | get minimum element
    //

    signal check[n];
    check[0] <== in[0];
    signal check_a[n - 1];
    signal check_b[n - 1];
    component smaller[n - 1] = LessThan(bits);
    for (var i = 0; i < (n - 1); i++) {
        smaller[i].in[0] <== check[i];
        smaller[i].in[1] <== in[i+1];

        check_a[i] <== smaller[i].out * check[i];
        check_b[i] <== (1 - smaller[i].out) * in[i+1];
        check[i+1] <== check_a[i] + check_b[i];
    }

    out <== check[n - 1];
}

template VectorNormMaxElement(n, bits) {
    signal input in[n];
    signal output out;

    //make sure that matrix size is feasible
    assert (n >= 2);

    //
    // 1. step | get maximum element
    //

    signal check[n];
    check[0] <== in[0];
    signal check_a[n - 1];
    signal check_b[n - 1];
    component greater[n - 1] = GreaterThan(bits);
    for (var i = 0; i < (n - 1); i++) {
        greater[i].in[0] <== check[i];
        greater[i].in[1] <== in[i+1];

        check_a[i] <== greater[i].out * check[i];
        check_b[i] <== (1 - greater[i].out) * in[i+1];
        check[i+1] <== check_a[i] + check_b[i];
    }

    out <== check[n - 1];
}

//component main = NormMinElement(4, 20, 5);