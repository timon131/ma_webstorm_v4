/*
const csvFilePath = "/media/sf_97_VM-share/02_Data/housing.csv";
const csv = require('csvtojson')
csv()
    .fromFile(csvFilePath)
    .then((jsonObj)=>{
        console.log(jsonObj);
    })
*/


function prepare_data(k, n) {
    // create values of X using random numbers
    var x_val = [];
    for (var j = 0; j < k; j++) {
        x_val[j] = [];
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            if (i == 0) {
                x_val[j][i] = 1;
            } else {
                x_val[j][i] = Math.random();
            }
        }
    }

    // create sign of X using random numbers
    var x_sign = [];
    for (var j = 0; j < k; j++) {
        x_sign[j] = [];
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            if (i == 0) {
                //first column is always positive
                x_sign[j][i] = 0;
            } else {
                // randomly generate 0s and 1s
                x_sign[j][i] = Math.random();
                x_sign[j][i] = Math.round(x_sign[j][i]);
            }
        }
    }

    // compute X (i.e., make values of X negative if X_SIGN == 1)
    var x = [];
    for (var j = 0; j < k; j++) {
        x[j] = [];
    }
    for (var j = 0; j < k; j++) {
        for (var i = 0; i < n; i++) {
            if (x_sign[j][i] == 1) {
                x[j][i] = -x_val[j][i];
            } else {
                x[j][i] = x_val[j][i];
            }
        }
    }

    // create values of y using random numbers
    var y_val = [];
    for (var j = 0; j < n; j++) {
        y_val[j] = [];
    }
    for (var j = 0; j < n; j++) {
        y_val[j][0] = Math.random();
    }

    // create sign of y using random numbers
    var y_sign = [];
    for (var j = 0; j < n; j++) {
        y_sign[j] = [];
    }
    for (var j = 0; j < n; j++) {
        // randomly generate 0s and 1s
        y_sign[j][0] = Math.round(Math.random());
    }

    // compute y (i.e., make values of y negative if y_SIGN == 1)
    var y = [];
    for (var j = 0; j < n; j++) {
        y[j] = [];
    }
    for (var j = 0; j < n; j++) {
        if (y_sign[j][0] == 1) {
            y[j][0] = -y_val[j][0];
        } else {
            y[j][0] = y_val[j][0];
        }
    }

    return [x, y];
}

//
//export
//

module.exports = {
    //functions:
    prepare_data,
}