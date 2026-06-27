const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tool: {
        type: String, // tool.id (e.g., 'uniswap')
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    developerReply: {
        type: String,
        default: null
    },
    developerRepliedAt: {
        type: Date,
        default: null
    },
    isZKVerified: {
        type: Boolean,
        default: false
    },
    anonymousName: {
        type: String
    },
    nullifierHash: {
        type: String,
        sparse: true
    },
    zkProof: {
        proof: mongoose.Schema.Types.Mixed,
        publicInputs: mongoose.Schema.Types.Mixed
    },
    signedMessage: {
        type: String
    },
    signature: {
        type: String
    },
    fheCiphertext: {
        type: String
    },
    ogLabsTxHash: {
        type: String
    }
});

// One rating per user per tool
RatingSchema.index({ user: 1, tool: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
