const mongoose = require('mongoose');

const ToolSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    },
    tags: [String],
    builder: {
        name: { type: String, required: true },
        handle: String,
        twitter: String,
        github: String
    },
    submitter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'experimental', 'disabled', 'pending'],
        default: 'active'
    },
    verified: {
        type: Boolean,
        default: false
    },
    trending: {
        type: Boolean,
        default: false
    },
    trendingReason: String,
    recentlyAdded: {
        type: Boolean,
        default: false
    },
    monthlyUsers: String,
    popularWith: [String],
    narrative: String,
    narrativeDescription: String,
    rating: Number,
    reviews: Number,
    llamaSlug: String, // Slug used in DeFiLlama API
    geckoId: String,   // CoinGecko ID for price lookup via DeFiLlama coins API
    metrics: {
        tvl: Number,
        tvlChange1h: Number,
        tvlChange24h: Number,
        tvlChange7d: Number,
        mcap: Number,
        fdv: Number,
        tokenPrice: Number,
        volume24h: Number,
        staking: Number,
        pool2: Number,
        chains: [String],
        lastUpdated: { type: Date, default: Date.now }
    }
});

module.exports = mongoose.model('Tool', ToolSchema);
