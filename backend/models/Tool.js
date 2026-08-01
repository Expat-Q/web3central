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
    logo: String,
    logoUrl: String,
    logoSource: String,
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
        github: String,
        discord: String,
        telegram: String
    },
    submitter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['active', 'experimental', 'disabled', 'pending', 'rejected'],
        default: 'active'
    },
    verified: {
        type: Boolean,
        default: false
    },
    isOffline: {
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
    auditLink: String,
    verificationTier: { type: Number, default: 4 }, // 1: DefiLlama, 2: DappRadar, 3: Explorer, 4: Manual
    metrics: {
        tvl: Number,
        tvlChange1h: Number,
        tvlChange24h: Number,
        tvlChange7d: Number,
        mcap: Number,
        fdv: Number,
        tokenPrice: Number,
        tokenSymbol: String,
        volume24h: Number,
        staking: Number,
        pool2: Number,
        chains: [String],
        lastUpdated: { type: Date, default: Date.now }
    },
    // --- Developer Dashboard & Analytics Fields ---
    clickCount: {
        type: Number,
        default: 0
    },
    weeklyTrendScore: {
        type: Number,
        default: 0
    },
    hasAirdrop: {
        type: Boolean,
        default: false
    },
    airdropStatus: {
        type: String,
        enum: ['none', 'upcoming', 'active', 'ended'],
        default: 'none'
    },
    isTestnet: {
        type: Boolean,
        default: false
    },
    airdropUrl: String,
    securityLevel: {
        type: String,
        enum: ['unaudited', 'community', 'audited', 'verified'],
        default: 'unaudited'
    },
    developerClaimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    developerClaimPending: {
        type: Boolean,
        default: false
    },
    sentiment: {
        bullish: [{ type: String }],
        bearish: [{ type: String }],
        lastUpdated: { type: Date, default: Date.now }
    },
    contractAddresses: [{
        chain: String,
        address: String
    }],
    githubRepo: String,
    githubCommits: {
        count30d: { type: Number, default: 0 },
        lastUpdated: Date
    }
});

module.exports = mongoose.model('Tool', ToolSchema);
