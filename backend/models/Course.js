const mongoose = require('mongoose');

const CourseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    platform: { type: String, default: 'Other' }, // e.g. "Anthropic", "YouTube", "Coursera"
    thumbnail: { type: String, default: '' },
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    isFree: { type: Boolean, default: true },
    tags: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', CourseSchema);
