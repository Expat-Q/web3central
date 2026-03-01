const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const { fetchLlamaData } = require('../services/llamaService');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const sync = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        await fetchLlamaData();

        console.log('Sync completed!');
        process.exit();
    } catch (err) {
        console.error('Error with sync:', err);
        process.exit(1);
    }
};

sync();
