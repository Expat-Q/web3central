const mongoose = require('mongoose');

const DeveloperProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    displayName: { type: String, required: true, maxlength: 100 },
    bio: { type: String, maxlength: 500, default: '' },
    builderType: {
        type: String,
        enum: ['solo', 'team', 'company'],
        default: 'solo'
    },
    // Social proof (at least one required at registration)
    twitter: { type: String, default: '' },
    github: { type: String, default: '' },
    website: { type: String, default: '' },
    walletAddress: { type: String, default: '' },
    // Verification tier
    tier: {
        type: String,
        enum: ['basic', 'claimed', 'verified', 'partner'],
        default: 'basic'
    },
    // Twitter/X claim verification
    pendingClaims: [{
        toolId: String,
        toolName: String,
        verificationCode: String,
        method: { type: String, enum: ['twitter', 'dns', 'wallet', 'admin'] },
        tweetUrl: String,
        initiatedAt: { type: Date, default: Date.now },
        expiresAt: Date,
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'expired'], default: 'pending' }
    }],
    // Agreed to terms
    agreedToTermsAt: { type: Date },
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DeveloperProfile', DeveloperProfileSchema);
