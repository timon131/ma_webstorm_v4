const csv = require('csvtojson');
const matrixmath = require ("mathjs");

////////////////////////////////////

const csvFilePath = '/media/sf_97_VM-share/02_Data/housing.csv';
async function importCsvToArray() {
    return csv().fromFile(csvFilePath);
}

function prepare_df(df, k, n) {
    let df_out = [];

    // convert to array and dummify
    let nearbay;    // NEAR BAY
    let ocean;      // <1H OCEAN
    let inland;     // INLAND
    let nearocean;  // NEAR OCEAN
    let island;     // ISLAND

    for (let i = 0; i < n; i++) {

        nearbay = 0;    // NEAR BAY
        ocean = 0;      // <1H OCEAN
        inland = 0;     // INLAND
        nearocean = 0;  // NEAR OCEAN
        island = 0;     // ISLAND

        if (df[i].ocean_proximity == 'NEAR BAY') {nearbay = 1;}
        else if (df[i].ocean_proximity == '<1H OCEAN') {ocean = 1;}
        else if (df[i].ocean_proximity == 'INLAND') {inland = 1;}
        else if (df[i].ocean_proximity == 'NEAR OCEAN') {nearocean = 1;}
        else if (df[i].ocean_proximity == 'ISLAND') {island = 1;}

        df_out[i] = [
            Number(df[i].median_house_value),
            Number(df[i].longitude),
            Number(df[i].latitude),
            Number(df[i].housing_median_age),
            Number(df[i].total_rooms),
            Number(df[i].total_bedrooms),
            Number(df[i].population),
            Number(df[i].households),
            Number(df[i].median_income),
            nearbay,
            ocean,
            inland,
            nearocean,
            island
        ]
    }

    // get mean
    let k_stand = k;
    if (k_stand > 9) {k_stand = 9;} //dummies don't need to be standardized

    let mean = [];

    let sum = [];
    for (let j = 0; j < k_stand; j++) {
        sum[j] = 0;
        for (let i = 0; i < n; i++) {
            sum[j] += df_out[i][j];
        }
        mean[j] = sum[j] / n;
    }
    //console.log(mean)

    // get variance
    let variance = [];
    for (let j = 0; j < k_stand; j++) {
        sum[j] = 0;
        for (let i = 0; i < n; i++) {
            sum[j] += (mean[j] - df_out[i][j])**2;
        }
        variance[j] = sum[j] / n;
    }
    //console.log(variance);

    // standardize
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < k_stand; j++) {
            df_out[i][j] = ((df_out[i][j] - mean[j]) / Math.sqrt(variance[j]));
        }
    }

    // consider k
    console.assert(k > 0 && k <= 13, 'k not applicable');
    let k_tmp;
    for (let i = 0; i < n; i++) {
        k_tmp = 13;
        while (k_tmp > k) {
            df_out[i].pop();
            k_tmp--;
        }
    }

    //get y
    let y = [];
    for (let i = 0; i < n; i++) {
        y[i] = [];
        y[i][0] = df_out[i][0];
    }

    //get x
    let x = df_out;
    for (let i = 0; i < n; i++) {
        x[i][0] = 1;
    }
    x = MatrixTranspose(x);


    return x;
}

async function getArray(k, n) {
    importCsvToArray().then(
        function (df) {
            let df_tmp = prepare_df(df, k, n);
            console.log(df_tmp);
        },
        function (error) {
            console.log(error);
        }
    );
}

function MatrixTranspose(a) {
    var a_rows = a.length;
    var a_cols = a[0].length;

    //initialize transposed matrix a_trans
    var a_trans = [];
    for (var j = 0; j < a_cols; j++) {
        a_trans[j] = [];
    }

    //transpose matrix
    for (var j = 0; j < a_rows; j++) {
        for (var i = 0; i < a_cols; i++) {
            a_trans[i][j] = a[j][i];
        }
    }

    return a_trans;
}

getArray(13, 20);


////////////////////////////////

function prepare_randomdata(k, n) {
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
    prepare_randomdata
}