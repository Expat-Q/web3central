const mongoose = require('mongoose');
require('dotenv').config();

const CourseSchema = new mongoose.Schema({
    title: String, description: String, url: String,
    platform: String, thumbnail: String,
    level: String, isFree: Boolean, tags: [String], createdAt: Date
});
const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected');

    // Clear broken thumbnails for Coursera — they block hotlinking.
    // Academy.jsx will render a styled platform banner fallback instead.
    const r = await Course.updateMany(
        { platform: 'Coursera' },
        { $set: { thumbnail: '' } }
    );
    console.log(`Cleared thumbnails for ${r.modifiedCount} Coursera courses`);

    await mongoose.disconnect();
    console.log('Done');
}

fix().catch(err => { console.error(err.message); process.exit(1); });
