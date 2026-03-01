const mongoose = require('mongoose');

const uris = [
    'mongodb+srv://web3central:Maxwell471%24@web3central.zxgqkbg.mongodb.net/web3central?retryWrites=true&w=majority',
    'mongodb+srv://web3central:Maxwell471@web3central.zxgqkbg.mongodb.net/web3central?retryWrites=true&w=majority'
];

async function test() {
    for (const uri of uris) {
        console.log('Testing URI (hidden pass):', uri.split('@')[1]);
        try {
            await mongoose.connect(uri);
            console.log('SUCCESS with:', uri);
            await mongoose.disconnect();
            process.exit(0);
        } catch (e) {
            console.log('FAILED:', e.message);
        }
    }
    console.log('ALL FAILED');
}

test();
