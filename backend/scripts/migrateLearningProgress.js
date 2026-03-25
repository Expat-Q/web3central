const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

const User = require('../models/User');
const { normalizeLearningProgressMap } = require('../utils/learningProgress');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateLearningProgress() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const users = await User.find({});
    let updated = 0;

    for (const user of users) {
        const { changed } = normalizeLearningProgressMap(user);
        if (changed) {
            await user.save();
            updated += 1;
        }
    }

    console.log(`Learning progress migration complete. Updated users: ${updated}/${users.length}`);
    await mongoose.disconnect();
}

migrateLearningProgress()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Learning progress migration failed:', err);
        process.exit(1);
    });
