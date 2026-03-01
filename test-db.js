const mongoose = require('mongoose');
require('dotenv').config({ path: './backend/.env' });

const testConnection = async () => {
    const uri = process.env.MONGODB_URI;
    console.log('Testing URI:', uri.replace(/:([^:@]+)@/, ':****@')); // Hide password

    try {
        await mongoose.connect(uri);
        console.log('Successfully connected to MongoDB!');
        await mongoose.disconnect();
    } catch (error) {
        console.error('Connection failed:', error);
        if (error.cause) console.error('Cause:', error.cause);
    }
};

testConnection();
