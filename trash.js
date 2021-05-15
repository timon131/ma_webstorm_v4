function get_client_ID() {
    return 1;
}


class class_client {
    constructor(data_test) {
        this.client_ID = get_client_ID();
        this.data_test = data_test;
    }



}

const client = [];
for (let i = 0; i < 5; i++) {
    client[i] = new class_client(10);
}

console.log(client[2].client_ID)