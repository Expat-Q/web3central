const mongoose = require('mongoose');

const QuestSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reward: {
        type: Number,
        required: true,
        default: 10
    },
    category: {
        type: String,
        enum: ['Daily', 'Weekly', 'Milestone', 'One-time', 'Social', 'Special'],
        default: 'Social'
    },
    type: {
        type: String,
        enum: ['link', 'action', 'review', 'submission', 'bug_report', 'twitter-follow', 'discord-join', 'community-post', 'daily-streak'],
        default: 'link'
    },
    targetUrl: {
        type: String
    },
    icon: {
        type: String,
        default: 'Star'
    },
    color: {
        type: String,
        default: 'indigo'
    },
    status: {
        type: String,
        enum: ['active', 'ended', 'draft'],
        default: 'active'
    },
    requiredProgress: {
        type: Number,
        default: 1
    }
}, { timestamps: true });

module.exports = mongoose.model('Quest', QuestSchema);
