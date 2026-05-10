const mongoose = require('mongoose');
const path = require('path');
// Load env from the backend directory
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function promote() {
    const email = 'olagokeabdulqudus5@gmail.com';
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        const user = await User.findOne({ email });
        if (!user) {
            console.error(`User ${email} not found.`);
            process.exit(1);
        }

        console.log(`Current role for ${email}: ${user.role}`);
        user.role = 'admin';
        await user.save();
        console.log(`Success! ${email} is now an admin.`);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('Promotion failed:', err);
        process.exit(1);
    }
}

promote();
