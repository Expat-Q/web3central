/**
 * Reset password for a specific user
 * Usage: node scripts/resetPassword.js <email> <newPassword>
 * Example: node scripts/resetPassword.js olagokeabdulqudus5@gmail.com MyNewPass123
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
        console.error('Usage: node scripts/resetPassword.js <email> <newPassword>');
        process.exit(1);
    }

    if (newPassword.length < 6) {
        console.error('Password must be at least 6 characters.');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        console.error(`❌ No user found with email: ${email}`);
        await mongoose.disconnect();
        process.exit(1);
    }

    // Hash manually then use updateOne to bypass ALL Mongoose middleware (prevents double-hashing)
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await User.collection.updateOne({ _id: user._id }, { $set: { password: hashed } });

    console.log(`✅ Password reset for ${user.name} (${user.email})`);
    console.log(`   New password: ${newPassword}`);
    console.log(`\n   Login at: http://localhost:3000/developer`);

    await mongoose.disconnect();
    process.exit(0);
}

run().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
