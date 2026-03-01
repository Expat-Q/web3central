const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');

dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Check if user exists
        let adminUser = await User.findOne({ email: 'admin@web3central.com' });

        if (adminUser) {
            adminUser.role = 'admin';
            await adminUser.save();
            console.log('Existing user updated to Admin role.');
        } else {
            await User.create({
                name: 'System Admin',
                email: 'admin@web3central.com',
                password: 'password123',
                role: 'admin' // Explicitly bypassing default
            });
            console.log('Created new Admin user: admin@web3central.com / password123');
        }

        process.exit();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
