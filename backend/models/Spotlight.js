const mongoose = require('mongoose');

const FeaturedToolSchema = new mongoose.Schema({
    initial: String,
    name: String,
    description: String
}, { _id: false });

const BuilderSpotlightSchema = new mongoose.Schema({
    name: String,
    role: String,
    description: String,
    story: String,
    twitter: String,
    github: String,
    xProfileImageUrl: String,
    rating: Number,
    featuredTools: [FeaturedToolSchema]
}, { _id: false });

const SpotlightSchema = new mongoose.Schema({
    title: String,
    description: String,
    projects: [{
        id: String,
        name: String,
        description: String,
        url: String
    }],
    // Legacy single entry (kept for backward compat)
    builderSpotlight: BuilderSpotlightSchema,
    // New: array of spotlights for carousel
    builderSpotlights: [BuilderSpotlightSchema]
});

module.exports = mongoose.model('Spotlight', SpotlightSchema);
