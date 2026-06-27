const mongoose = require('mongoose');

const DaoApplicationSchema = new mongoose.Schema({
    dao: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tool',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    talent: {
        type: String,
        required: true,
        enum: ['developer', 'designer', 'marketing', 'community', 'research', 'operations', 'other']
    },
    valueAdd: {
        type: String,
        required: true,
        maxlength: 500
    },
    portfolio: String,
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, { timestamps: true });

// Prevent duplicate applications
DaoApplicationSchema.index({ dao: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('DaoApplication', DaoApplicationSchema);
