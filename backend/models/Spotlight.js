const mongoose = require('mongoose');

const SpotlightSchema = new mongoose.Schema({
    title: String,
    description: String,
    projects: [{
        id: String,
        name: String,
        description: String,
        url: String
    }],
    builderSpotlight: {
        name: String,
        role: String,
        description: String,
        twitter: String,
        github: String,
        xProfileImageUrl: String,
        rating: Number,
        featuredTools: [{
            initial: String,
            name: String,
            description: String
        }]
    }
});

module.exports = mongoose.model('Spotlight', SpotlightSchema);
