
function calcCost(b_round_pos, b_round_sign, x_test_pos, x_test_sign, y_test_pos, y_test_sign, dec) {

    // unsignify
    let b_round = [];
    for (let j = 0; j < b_round_pos.length; j++) {
        if (b_round_sign[j] == 1) {
            b_round[j] = -b_round_pos[j] / 10**(2*dec);
        } else {
            b_round[j] = b_round_pos[j] / 10**(2*dec);
        }
    }

    let x_test = [];
    for (let j = 0; j < x_test_pos.length; j++) {
        x_test[j] = [];
        for (let i = 0; i < x_test_pos[j].length; i++) {
            if (x_test_sign[j][i] == 1) {
                x_test[j][i] = -x_test_pos[j][i];
            } else {
                x_test[j][i] = x_test_pos[j][i];
            }
        }
    }

    let y_test = [];
    for (let i = 0; i < y_test_sign.length; i++) {
        if (y_test_sign[i] == 1) {
            y_test[i] = -y_test_pos[i][0];
        } else {
            y_test[i] = y_test_pos[i][0];
        }
    }


    // estimate y
    let y_est = [];
    for (let i = 0; i < x_test[0].length; i++) {
        y_est[i] = BigInt(0);
        for (let j = 0; j < x_test.length; j++) {
            y_est[i] += BigInt(b_round[j]) * BigInt(x_test[j][i]);
        }
    }

    //calculate RSS
    let RSS = BigInt(0);
    let dec_abs = 10**dec;
    for (let i = 0; i < y_est.length; i++) {
        RSS += (BigInt(y_test[i]) * BigInt(dec_abs) - BigInt(y_est[i])) * (BigInt(y_test[i]) * BigInt(dec_abs) - BigInt(y_est[i]));
    }

    return RSS;
}


//
//export
//

module.exports = {
    //functions:
    calcCost
}