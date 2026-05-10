const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email role');
        console.log('--- User List ---');
        users.forEach(u => {
            console.log(`${u.name} (${u.email}) - Role: ${u.role}`);
        });
        console.log('-----------------');

        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail) {
            const adminUser = await User.findOne({ email: adminEmail });
            if (adminUser) {
                if (adminUser.role !== 'admin') {
                    console.log(`Promoting ${adminEmail} to admin...`);
                    adminUser.role = 'admin';
                    await adminUser.save();
                    console.log('Promotion successful.');
                } else {
                    console.log(`${adminEmail} is already an admin.`);
                }
            } else {
                console.log(`User with email ${adminEmail} not found in database.`);
            }
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
}

checkUsers();
