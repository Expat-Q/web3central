require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function wipe() {
    await mongoose.connect(MONGO_URI);
    const db = mongoose.connection.db;
    const lessonsResult = await db.collection('lessons').deleteMany({});
    console.log(`✅ Deleted ${lessonsResult.deletedCount} lesson(s)`);
    process.exit(0);
}

wipe().catch(err => { console.error(err); process.exit(1); });
