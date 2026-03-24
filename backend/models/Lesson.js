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
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isUserGenerated: {
        type: Boolean,
        default: false
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    ratings: {
        thumbsUp: { type: Number, default: 0 },
        thumbsDown: { type: Number, default: 0 },
        thumbsUpBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        thumbsDownBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lesson', LessonSchema);
