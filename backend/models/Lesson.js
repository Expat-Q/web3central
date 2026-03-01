const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    module: { type: String, required: true },
    title: { type: String, required: true },
    description: String,
    contentMarkdown: { type: String, required: true },
    xpReward: { type: Number, default: 100 },
    prerequisites: [String],
    quiz: {
        questions: [{
            questionText: String,
            options: [String],
            correctAnswerIndex: Number,
            explanation: String
        }]
    },
    estimatedTime: String,
    level: {
        type: String,
        enum: ['Beginner', 'Intermediate', 'Advanced'],
        default: 'Beginner'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lesson', LessonSchema);
